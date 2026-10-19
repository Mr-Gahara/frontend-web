import { expect, Page } from "@playwright/test";

/*
 * Helper spec transfer stok: login, token API yang mengikuti pin-refresh,
 * pemanggilan API lewat page.request, serta penyiapan dan pembatalan surat
 * jalan uji. Dipakai spec penerimaan dan spec transfer gudang, agar
 * penanganan token dan pembersihan data cukup ada di satu tempat
 * (docs/referensi/playwright.md, Catatan Playwright).
 */

export const BASIS = "http://localhost:3000";

export const JAWAB_GAGAL = {
  status: 500,
  contentType: "application/json",
  body: JSON.stringify({ status: "error", message: "uji" }),
};

export type LokasiMentah = { id: string; nama: string | null; tipe: string | null } | null;

export type ItemTransferMentah = {
  id: string;
  bahanBaku: { id: string; namaBahan: string | null; satuan: string | null } | null;
  qtyKirim: number;
  qtyTerima?: number;
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
  catatan?: string | null;
  dariLokasi: { tipe?: string } | null;
  keLokasi: { tipe?: string } | null;
};

export type Auth = () => string;

/** Pengajuan uji baru: satu unit bahan yang stok gudangnya cukup, dari gudang ke outlet tenant, diajukan lalu disetujui. */
async function buatPengajuanUji(page: Page, auth: Auth): Promise<string> {
  const lokasi = await api<(Berid & { tipe?: string })[]>(page, auth, "GET", "/location");
  expect(lokasi.status, `GET /location: ${lokasi.pesan}`).toBe(200);
  const gudang = (lokasi.data ?? []).find((l) => l.tipe === "Gudang");
  const outlet = (lokasi.data ?? []).find((l) => l.tipe === "Outlet");
  expect(gudang && outlet, "tenant uji harus punya gudang dan outlet").toBeTruthy();
  const inventori = await api<(Berid & { stok: number; item: Berid | null })[]>(
    page,
    auth,
    "GET",
    `/inventory?locationID=${idDari(gudang)}`,
  );
  expect(inventori.status, `GET /inventory gudang: ${inventori.pesan}`).toBe(200);
  const bahan = (inventori.data ?? []).find((i) => i.stok >= 1 && i.item);
  expect(bahan, "gudang uji harus punya bahan dengan stok minimal 1").toBeTruthy();
  const semuaBahan = await api<(Berid & { satuan?: string })[]>(page, auth, "GET", "/bahanbaku");
  const satuan = (semuaBahan.data ?? []).find((b) => idDari(b) === idDari(bahan!.item))?.satuan;
  expect(satuan, "satuan bahan uji").toBeTruthy();
  const buat = await api<Berid>(page, auth, "POST", "/pengajuanstok", {
    dariLocationID: idDari(gudang),
    keLocationID: idDari(outlet),
    items: [{ bahanBakuID: idDari(bahan!.item), jumlah: 1, satuan }],
    catatan: CATATAN_PENGAJUAN_UJI,
  });
  expect(buat.status, `buat pengajuan uji: ${buat.pesan}`).toBeLessThan(300);
  const id = idDari(buat.data);
  const ajukan = await api(page, auth, "PATCH", `/pengajuanstok/${id}/submit`, {});
  expect(ajukan.status, `submit pengajuan uji: ${ajukan.pesan}`).toBeLessThan(300);
  // Owner boleh menyetujui pengajuannya sendiri sejak backend yoga 2e25bb6
  // (P20, keputusan RH5a), dan persetujuannya ditandai disetujuiSendiri.
  const setuju = await api<{ disetujuiSendiri?: boolean }>(page, auth, "PATCH", `/pengajuanstok/${id}/approve`, {});
  expect(setuju.status, `approve pengajuan uji oleh pengajunya sendiri: ${setuju.pesan}`).toBe(200);
  expect(setuju.data?.disetujuiSendiri, "persetujuan ditandai disetujuiSendiri").toBe(true);
  return id;
}

/** Pengajuan uji APPROVED atau PENDING tanpa surat jalan dipakai ulang; bila tidak ada, dibuat baru. */
async function pengajuanUjiSiap(page: Page, auth: Auth): Promise<string> {
  for (const status of ["APPROVED", "PENDING"]) {
    const daftar = await api<PengajuanMentah[]>(page, auth, "GET", "/pengajuanstok?status=" + status);
    expect(daftar.status, `GET pengajuan ${status}: ${daftar.pesan}`).toBe(200);
    const milikUji = (daftar.data ?? []).find((p) => !p.transferStokID && p.catatan === CATATAN_PENGAJUAN_UJI);
    if (milikUji) return idDari(milikUji);
  }
  return buatPengajuanUji(page, auth);
}

const buatSuratJalan = (page: Page, auth: Auth, pengajuanStokID: string) =>
  api<Berid>(page, auth, "POST", "/transferstok", { pengajuanStokID, tanggalKirim: new Date().toISOString() });

type Berid = { id?: string; _id?: string };
const idDari = (x: Berid | null | undefined) => String(x?.id ?? x?._id ?? "");

/** Pengajuan uji milik spec transfer (keputusan R8), dikenali lewat catatannya. */
const CATATAN_PENGAJUAN_UJI = "E2E pengajuan uji transfer";

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
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  data?: object,
): Promise<{ status: number; data: T; pesan: string }> {
  const res = await page.request.fetch(BASIS + "/api" + path, {
    method,
    headers: { Authorization: auth() },
    data,
  });
  const body = await res.json().catch(() => ({}));
  // Validator penjualan dan pembayaran membalas { errors } tanpa message,
  // karena dibalas langsung di route dan tidak lewat errorHandler.
  const pesan = body.message ?? (Array.isArray(body.errors) ? body.errors.join(", ") : "");
  return { status: res.status(), data: body.data as T, pesan: String(pesan) };
}

/**
 * Menyiapkan surat jalan uji dari pengajuan uji milik spec (keputusan R8 dan
 * R13), lalu mengirimnya kecuali `kirim: false` (surat jalan tetap PENDING).
 * Bila stok gudang untuk pengajuan yang dipakai ulang tidak lagi cukup,
 * pengajuan baru dibuat satu kali. Kegagalan lain menggagalkan test beserta
 * status dan pesan backend, dan surat jalan yang sudah tercipta ditutup lebih
 * dulu agar tidak tertinggal.
 */
export async function siapkanSuratJalan(
  page: Page,
  auth: Auth,
  opsi: { kirim?: boolean } = {},
): Promise<TransferMentah> {
  let buat = await buatSuratJalan(page, auth, await pengajuanUjiSiap(page, auth));
  if (buat.status === 400 && /tidak mencukupi/i.test(buat.pesan)) {
    buat = await buatSuratJalan(page, auth, await buatPengajuanUji(page, auth));
  }
  expect(buat.status, `buat surat jalan: ${buat.pesan}`).toBe(201);
  const id = idDari(buat.data);
  if (opsi.kirim !== false) {
    const kirim = await api(page, auth, "PATCH", `/transferstok/${id}/kirim`, {});
    if (kirim.status !== 200) await tutupSuratJalanUji(page, auth, id);
    expect(kirim.status, `kirim surat jalan: ${kirim.pesan}`).toBe(200);
  }
  const detail = await api<TransferMentah>(page, auth, "GET", `/transferstok/${id}`);
  if (detail.status !== 200) await tutupSuratJalanUji(page, auth, id);
  expect(detail.status, `detail surat jalan: ${detail.pesan}`).toBe(200);
  return detail.data;
}

/**
 * Menutup surat jalan uji dari blok finally. Sejak backend 465b438 (kontrak
 * P12) hanya surat jalan PENDING yang dapat dibatalkan; surat jalan DIKIRIM
 * ditutup lewat terima penuh (body kosong), sehingga barangnya berpindah ke
 * outlet secara permanen. Pemeriksaannya lunak: pengecualian yang dilempar di
 * finally menggantikan kegagalan asli test, dan penyebab sebenarnya hilang
 * dari laporan.
 */
export async function tutupSuratJalanUji(page: Page, auth: Auth, id: string) {
  const detail = await api<TransferMentah>(page, auth, "GET", `/transferstok/${id}`);
  const status = detail.data?.status;
  if (status === "PENDING") {
    const res = await api(page, auth, "PATCH", `/transferstok/${id}/batal`, {});
    expect.soft(res.status, `batalkan surat jalan uji ${id}: ${res.pesan}`).toBe(200);
  } else if (status === "DIKIRIM") {
    const res = await api(page, auth, "PATCH", `/transferstok/${id}/terima`, {});
    expect.soft(res.status, `terima surat jalan uji ${id}: ${res.pesan}`).toBe(200);
  } else {
    expect.soft(["DITERIMA", "BATAL"], `surat jalan uji ${id} berstatus ${status ?? detail.status}`).toContain(status);
  }
}