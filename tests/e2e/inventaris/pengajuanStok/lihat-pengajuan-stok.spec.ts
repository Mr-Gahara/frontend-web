import { test, expect, Page, Response } from "@playwright/test";

const URL_OUTLET = "http://localhost:3000/dashboard/outlet/inventaris/pengajuanStok";
const URL_GUDANG = "http://localhost:3000/dashboard/gudang/pengajuanStok";

type PengajuanMentah = {
  id: string;
  nomorPengajuan: string;
  status: string;
  dariLokasi: { id?: string; nama?: string; tipe?: string } | null;
  keLokasi: { id?: string; nama?: string; tipe?: string } | null;
};

// ============================================================
// HELPER: Login
// ============================================================
async function login(page: Page) {
  await page.goto("http://localhost:3000/login");
  await page.getByLabel(/email/i).fill("toko@gmail.com");
  await page.getByLabel(/password/i).fill("Toko1234");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/login/pengguna");
  await page.getByLabel(/nama/i).fill("Ridho");
  await page.getByLabel(/pin/i).fill("123456");
  await page.getByRole("button", { name: /login/i }).click();

  await page.waitForURL("**/dashboard");
}

// ============================================================
// HELPER: Respons daftar pengajuan
// ============================================================
// Path dicocokkan tanpa membedakan huruf: halaman lama memanggil
// /pengajuanStok, features/ memakai /pengajuanstok.
function daftarPengajuan(status: string | null) {
  return (r: Response) => {
    if (r.request().method() !== "GET" || !/\/api\/pengajuanstok(\?|$)/i.test(r.url())) return false;
    return new URL(r.url()).searchParams.get("status") === status;
  };
}

async function isiRespons(r: Response): Promise<PengajuanMentah[]> {
  expect(r.status()).toBe(200);
  return ((await r.json()) as { data: PengajuanMentah[] }).data;
}

/** Buka halaman dan tangkap daftar yang dimuatnya sendiri. */
async function buka(page: Page, url: string, statusBawaan: string | null) {
  await page.goto(url, { waitUntil: "commit" });
  return isiRespons(await page.waitForResponse(daftarPengajuan(statusBawaan)));
}

async function periksaJumlahBaris(page: Page, jumlah: number, pesanKosong: string) {
  const baris = page.locator("table tbody tr");
  if (jumlah === 0) {
    await expect(page.getByText(pesanKosong)).toBeVisible();
    return;
  }
  await expect(baris).toHaveCount(jumlah);
}

const dariOutlet = (p: PengajuanMentah) => p.dariLokasi?.tipe === "Outlet";
// Ruang gudang: hanya pengajuan ke gudang, dan draf tidak pernah tampil (keputusan produk).
const diGudang = (p: PengajuanMentah) => p.keLokasi?.tipe === "Gudang" && p.status !== "DRAFT";

// ============================================================
// OUTLET
// ============================================================
test.describe("Daftar pengajuan stok outlet", () => {
  const KOSONG = "Tidak ada data pengajuan stok";

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("bawaan Semua Status: tanpa filter status, pengajuan dari outlet", async ({ page }) => {
    const data = await buka(page, URL_OUTLET, null);
    await expect(page.getByRole("heading", { name: "Pengajuan Stok Barang" })).toBeVisible();
    await periksaJumlahBaris(page, data.filter(dariOutlet).length, KOSONG);
  });

  test("tab status mengirim status ke server dan menampilkan hasilnya", async ({ page }) => {
    await buka(page, URL_OUTLET, null);
    const tunggu = page.waitForResponse(daftarPengajuan("SUBMITTED"));
    // Di ruang outlet, tab SUBMITTED berlabel "MENUNGGU".
    await page.getByRole("button", { name: "MENUNGGU", exact: true }).click();
    const data = await isiRespons(await tunggu);
    expect(data.every((p) => p.status === "SUBMITTED")).toBe(true);
    await periksaJumlahBaris(page, data.filter(dariOutlet).length, KOSONG);
  });

  test("pencarian nomor pengajuan menyaring baris", async ({ page }) => {
    const data = (await buka(page, URL_OUTLET, null)).filter(dariOutlet);
    test.skip(data.length === 0, "Belum ada pengajuan stok");
    const kata = data[0].nomorPengajuan;
    await page.getByPlaceholder("Cari No. Pengajuan...").fill(kata);
    const harapan = data.filter((p) => p.nomorPengajuan.toLowerCase().includes(kata.toLowerCase()));
    await periksaJumlahBaris(page, harapan.length, KOSONG);
    await expect(page.locator("table tbody tr").first()).toContainText(kata);
  });

  test("owner: pilih satu outlet mengirim locationID outlet itu", async ({ page }) => {
    const data = (await buka(page, URL_OUTLET, null)).filter(dariOutlet);
    const contoh = data.find((p) => p.dariLokasi?.id && p.dariLokasi?.nama);
    test.skip(!contoh, "Belum ada pengajuan dari outlet");
    const idOutlet = contoh!.dariLokasi!.id!;
    const tunggu = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        /\/api\/pengajuanstok(\?|$)/i.test(r.url()) &&
        new URL(r.url()).searchParams.get("locationID") === idOutlet,
    );
    await page.getByText("Semua Outlet", { exact: true }).click();
    await page.getByRole("option", { name: contoh!.dariLokasi!.nama!, exact: true }).click();
    const hasil = await isiRespons(await tunggu);
    await periksaJumlahBaris(page, hasil.filter(dariOutlet).length, KOSONG);
  });

  test("tombol buat membuka halaman buat pengajuan", async ({ page }) => {
    await buka(page, URL_OUTLET, null);
    await page.getByRole("button", { name: /buat pengajuan baru/i }).click();
    await page.waitForURL(/\/pengajuanStok\/buatPengajuan$/);
  });

  test("tombol pada baris membuka detail pengajuan itu", async ({ page }) => {
    const data = (await buka(page, URL_OUTLET, null)).filter(dariOutlet);
    test.skip(data.length === 0, "Belum ada pengajuan stok");
    const baris = page.locator("table tbody tr").first();
    await baris.getByRole("button", { name: /lanjutkan draft|detail/i }).click();
    await page.waitForURL(new RegExp(`/dashboard/outlet/inventaris/pengajuanStok/${data[0].id}$`));
  });
});

// ============================================================
// GUDANG
// ============================================================
test.describe("Daftar pengajuan stok gudang", () => {
  const KOSONG = "Belum ada permintaan stok di kategori ini.";

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  async function bukaSemua(page: Page) {
    await buka(page, URL_GUDANG, "SUBMITTED");
    const tunggu = page.waitForResponse(daftarPengajuan(null));
    await page.getByRole("button", { name: "Semua", exact: true }).click();
    return isiRespons(await tunggu);
  }

  test("bawaan PERLU TINJAUAN: mengirim status SUBMITTED", async ({ page }) => {
    const data = await buka(page, URL_GUDANG, "SUBMITTED");
    await expect(page.getByRole("heading", { name: /inbox permintaan stok/i })).toBeVisible();
    expect(data.every((p) => p.status === "SUBMITTED")).toBe(true);
    await periksaJumlahBaris(page, data.filter(diGudang).length, KOSONG);
  });

  test("tab Semua tanpa filter status, tanpa draf", async ({ page }) => {
    const data = await bukaSemua(page);
    await periksaJumlahBaris(page, data.filter(diGudang).length, KOSONG);
    for (const draf of data.filter((p) => p.status === "DRAFT")) {
      await expect(page.locator("table tbody tr", { hasText: draf.nomorPengajuan })).toHaveCount(0);
    }
  });

  test("pencarian nama outlet asal menyaring baris", async ({ page }) => {
    const data = (await bukaSemua(page)).filter(diGudang);
    const contoh = data.find((p) => p.dariLokasi?.nama);
    test.skip(!contoh, "Belum ada pengajuan dengan lokasi asal");
    const kata = contoh!.dariLokasi!.nama!;
    await page.getByPlaceholder("Cari No. Pengajuan / Outlet...").fill(kata);
    const kecil = kata.toLowerCase();
    const harapan = data.filter(
      (p) => p.nomorPengajuan.toLowerCase().includes(kecil) || (p.dariLokasi?.nama ?? "").toLowerCase().includes(kecil),
    );
    await periksaJumlahBaris(page, harapan.length, KOSONG);
  });

  test("tombol Tinjau membuka detail pengajuan itu", async ({ page }) => {
    const data = (await bukaSemua(page)).filter(diGudang);
    test.skip(data.length === 0, "Belum ada pengajuan stok");
    await page.locator("table tbody tr").first().getByRole("button", { name: "Tinjau" }).click();
    await page.waitForURL(new RegExp(`/dashboard/gudang/pengajuanStok/${data[0].id}$`));
  });
});
