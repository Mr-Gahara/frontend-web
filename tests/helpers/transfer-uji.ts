import { expect, Page, request } from "@playwright/test";

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
  await setujuiSebagaiPenyetuju(page, auth, id);
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

/**
 * Pengguna penyetuju uji (keputusan R13). Backend melarang pengaju menyetujui
 * pengajuannya sendiri tanpa pengecualian, sehingga pengajuan uji yang dibuat
 * Ridho disetujui pengguna ini. Dibuat sekali dengan peran pertama selain
 * Owner yang memegang approve-pengajuan-stok.
 */
export const NAMA_PENYETUJU = "E2E Penyetuju";
const PIN_PENYETUJU = "135790";

async function pastikanPenyetuju(page: Page, auth: Auth) {
  const pengguna = await api<(Berid & { nama?: string })[]>(page, auth, "GET", "/pengguna");
  expect(pengguna.status, `GET /pengguna: ${pengguna.pesan}`).toBe(200);
  if ((pengguna.data ?? []).some((p) => p.nama === NAMA_PENYETUJU)) return;
  const peran = await api<(Berid & { namaRole?: string; permissions?: unknown[] })[]>(page, auth, "GET", "/role");
  expect(peran.status, `GET /role: ${peran.pesan}`).toBe(200);
  const namaIzin = (x: unknown) => (typeof x === "string" ? x : (x as { nama?: string } | null)?.nama);
  const cocok = (peran.data ?? []).find(
    (r) => !/owner/i.test(r.namaRole ?? "") && (r.permissions ?? []).some((x) => namaIzin(x) === "approve-pengajuan-stok"),
  );
  expect(cocok, "perlu peran selain Owner yang memegang approve-pengajuan-stok untuk pengguna penyetuju uji").toBeTruthy();
  const buat = await api(page, auth, "POST", "/pengguna/register-pengguna", {
    nama: NAMA_PENYETUJU,
    pin: PIN_PENYETUJU,
    roleID: idDari(cocok),
    aksesType: ["web"],
  });
  expect(buat.status, `buat pengguna penyetuju uji: ${buat.pesan}`).toBeLessThan(300);
}

/**
 * Menyetujui pengajuan sebagai pengguna penyetuju uji. Login akun dan login
 * PIN berjalan di konteks permintaan terpisah, karena keduanya memasang
 * cookie refreshToken yang akan menimpa sesi Ridho di browser test.
 */
async function setujuiSebagaiPenyetuju(page: Page, auth: Auth, pengajuanId: string) {
  await pastikanPenyetuju(page, auth);
  const ctx = await request.newContext({ baseURL: BASIS });
  try {
    const akun = await ctx.post("/api/akun/auth/login", { data: { email: "toko@gmail.com", password: "Toko1234" } });
    const isiAkun = await akun.json().catch(() => ({}));
    expect(akun.status(), `login akun untuk penyetuju: ${isiAkun.message ?? ""}`).toBe(200);
    const pin = await ctx.post("/api/pengguna/pin-login", {
      data: { nama: NAMA_PENYETUJU, pin: PIN_PENYETUJU, loginType: "web" },
      headers: { Authorization: "Bearer " + isiAkun.accessToken },
    });
    const isiPin = await pin.json().catch(() => ({}));
    expect(pin.status(), `login PIN penyetuju: ${isiPin.message ?? ""}`).toBe(200);
    const token = cariToken(isiPin);
    expect(token, "respons login PIN penyetuju membawa access token").toBeTruthy();
    const setuju = await ctx.patch(`/api/pengajuanstok/${pengajuanId}/approve`, {
      headers: { Authorization: "Bearer " + token },
    });
    expect(setuju.status(), `approve pengajuan uji: ${(await setuju.text()).slice(0, 200)}`).toBe(200);
  } finally {
    await ctx.dispose();
  }
}

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