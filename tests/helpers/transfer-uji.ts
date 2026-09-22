import { expect, Page } from "@playwright/test";

/*
 * Helper spec transfer stok: login, token API yang mengikuti pin-refresh,
 * pemanggilan API lewat page.request, serta penyiapan dan pembatalan surat
 * jalan uji. Dipakai spec penerimaan dan spec transfer gudang, agar
 * penanganan token dan pembersihan data cukup ada di satu tempat
 * (docs/refactor/pengujian.md, Catatan Playwright).
 */

export const BASIS = "http://localhost:3000";

export const JAWAB_GAGAL = {
  status: 500,
  contentType: "application/json",
  body: JSON.stringify({ status: "error", message: "uji" }),
};

export type LokasiMentah = { id: string; nama: string | null; tipe: string | null } | null;

export type ItemTransferMentah = {
  bahanBaku: { id: string; namaBahan: string | null; satuan: string | null } | null;
  qtyKirim: number;
};

export type TransferMentah = {
  id: string;
  nomorTransfer: string;
  status: string;
  dariLokasi: LokasiMentah;
  keLokasi: LokasiMentah;
  pengajuanStokID: string | null;
  items: ItemTransferMentah[];
};

type PengajuanMentah = {
  id: string;
  transferStokID: string | null;
  dariLokasi: { tipe?: string } | null;
  keLokasi: { tipe?: string } | null;
};

export type Auth = () => string;

export async function login(page: Page) {
  await page.goto(BASIS + "/login");
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill("Ridho");
  await page.getByLabel(/pin/i).fill("123456");
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/dashboard");
}

/** Mencari access token (JWT) di mana pun di dalam isi respons. */
function cariToken(o: unknown): string | null {
  if (typeof o === "string" && /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(o)) return o;
  if (o && typeof o === "object") {
    for (const v of Object.values(o)) {
      const t = cariToken(v);
      if (t) return t;
    }
  }
  return null;
}

/**
 * Membuka halaman dan mengembalikan pembaca access token yang selalu terbaru.
 * Setiap navigasi penuh (goto, reload) memulihkan sesi lewat pin-refresh, dan
 * token sebelum refresh itu dijawab 401 "Sesi tidak valid" (trace 21
 * September 2026). Karena itu token awal diambil dari respons pin-refresh
 * pemuatan halaman ini, lalu diganti setiap kali halaman melakukan
 * pin-refresh lagi. Token dari permintaan pertama yang membawa Authorization
 * tidak dipakai, karena bisa milik halaman sebelumnya.
 */
export async function bukaDenganAuth(page: Page, url: string): Promise<Auth> {
  const polaRefresh = /\/api\/pengguna\/pin-refresh(\?|$)/i;
  const tRefresh = page.waitForResponse((r) => polaRefresh.test(r.url()) && r.status() === 200);
  await page.goto(url);
  const awal = cariToken(await (await tRefresh).json());
  expect(awal, "respons pin-refresh harus membawa access token").toBeTruthy();
  let token = "Bearer " + awal;
  page.on("response", async (r) => {
    if (!polaRefresh.test(r.url()) || r.status() !== 200) return;
    const baru = cariToken(await r.json().catch(() => null));
    if (baru) token = "Bearer " + baru;
  });
  return () => token;
}

export async function api<T>(
  page: Page,
  auth: Auth,
  method: "GET" | "POST" | "PATCH",
  path: string,
  data?: object,
): Promise<{ status: number; data: T; pesan: string }> {
  const res = await page.request.fetch(BASIS + "/api" + path, {
    method,
    headers: { Authorization: auth() },
    data,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), data: body.data as T, pesan: String(body.message ?? "") };
}

/**
 * Membuat surat jalan dari pengajuan yang layak, lalu mengirimnya kecuali
 * `kirim: false` (surat jalan tetap PENDING). Hanya penolakan stok kurang
 * (400 saat membuat, sebelum dokumen tercipta) yang membuat pengajuan
 * dilewati. Kegagalan lain menggagalkan test beserta status dan pesan
 * backend, dan surat jalan yang sudah tercipta dibatalkan lebih dulu agar
 * stok gudang tidak tertahan.
 */
export async function siapkanSuratJalan(
  page: Page,
  auth: Auth,
  opsi: { kirim?: boolean } = {},
): Promise<TransferMentah | null> {
  for (const status of ["APPROVED", "PENDING"]) {
    const daftar = await api<PengajuanMentah[]>(page, auth, "GET", "/pengajuanstok?status=" + status);
    expect(daftar.status, `GET pengajuan ${status}: ${daftar.pesan}`).toBe(200);
    for (const p of daftar.data ?? []) {
      if (p.transferStokID || p.dariLokasi?.tipe !== "Gudang" || p.keLokasi?.tipe !== "Outlet") continue;
      const buat = await api<{ id: string }>(page, auth, "POST", "/transferstok", {
        pengajuanStokID: p.id,
        tanggalKirim: new Date().toISOString(),
      });
      if (buat.status === 400 && /tidak mencukupi/i.test(buat.pesan)) continue;
      expect(buat.status, `buat surat jalan: ${buat.pesan}`).toBe(201);
      const id = buat.data.id;
      const kirim = opsi.kirim === false ? null : await api(page, auth, "PATCH", `/transferstok/${id}/kirim`, {});
      const kirimBerhasil = kirim === null || kirim.status === 200;
      const detail = kirimBerhasil ? await api<TransferMentah>(page, auth, "GET", `/transferstok/${id}`) : null;
      if (!kirimBerhasil || detail?.status !== 200) {
        await api(page, auth, "PATCH", `/transferstok/${id}/batal`, {});
      }
      if (kirim) expect(kirim.status, `kirim surat jalan: ${kirim.pesan}`).toBe(200);
      expect(detail?.status, `detail surat jalan: ${detail?.pesan}`).toBe(200);
      return detail!.data;
    }
  }
  return null;
}

/**
 * Dipanggil dari blok finally, sehingga pemeriksaannya lunak: pengecualian
 * yang dilempar di finally menggantikan kegagalan asli test, dan penyebab
 * sebenarnya hilang dari laporan.
 */
export async function batalkan(page: Page, auth: Auth, id: string) {
  const res = await api(page, auth, "PATCH", `/transferstok/${id}/batal`, {});
  expect.soft(res.status, `surat jalan uji ${id} harus dibatalkan agar stok gudang kembali: ${res.pesan}`).toBe(200);
}