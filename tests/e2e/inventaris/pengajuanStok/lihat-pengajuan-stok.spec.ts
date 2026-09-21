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

// Arah backend: dariLokasi adalah gudang asal barang dan keLokasi outlet
// peminta (features/pengajuan-stok/arah.ts). Pengajuan terbalik tidak tampil.
const arahBenar = (p: PengajuanMentah) => p.dariLokasi?.tipe === "Gudang" && p.keLokasi?.tipe === "Outlet";
const diOutlet = (p: PengajuanMentah) => arahBenar(p);
// Ruang gudang: tanpa draf, karena draf tidak pernah tampil (keputusan produk).
const diGudang = (p: PengajuanMentah) => arahBenar(p) && p.status !== "DRAFT";

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
    await periksaJumlahBaris(page, data.filter(diOutlet).length, KOSONG);
  });

  test("tab status mengirim status ke server dan menampilkan hasilnya", async ({ page }) => {
    await buka(page, URL_OUTLET, null);
    const tunggu = page.waitForResponse(daftarPengajuan("SUBMITTED"));
    // Di ruang outlet, tab SUBMITTED berlabel "MENUNGGU".
    await page.getByRole("button", { name: "MENUNGGU", exact: true }).click();
    const data = await isiRespons(await tunggu);
    expect(data.every((p) => p.status === "SUBMITTED")).toBe(true);
    await periksaJumlahBaris(page, data.filter(diOutlet).length, KOSONG);
  });

  test("pencarian nomor pengajuan menyaring baris", async ({ page }) => {
    const data = (await buka(page, URL_OUTLET, null)).filter(diOutlet);
    test.skip(data.length === 0, "Belum ada pengajuan stok");
    const kata = data[0].nomorPengajuan;
    await page.getByPlaceholder("Cari No. Pengajuan...").fill(kata);
    const harapan = data.filter((p) => p.nomorPengajuan.toLowerCase().includes(kata.toLowerCase()));
    await periksaJumlahBaris(page, harapan.length, KOSONG);
    await expect(page.locator("table tbody tr").first()).toContainText(kata);
  });

  test("owner: pilih satu outlet mengirim locationID outlet itu", async ({ page }) => {
    const data = (await buka(page, URL_OUTLET, null)).filter(diOutlet);
    const contoh = data.find((p) => p.keLokasi?.id && p.keLokasi?.nama);
    test.skip(!contoh, "Belum ada pengajuan outlet");
    const idOutlet = contoh!.keLokasi!.id!;
    const tunggu = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        /\/api\/pengajuanstok(\?|$)/i.test(r.url()) &&
        new URL(r.url()).searchParams.get("locationID") === idOutlet,
    );
    await page.getByText("Semua Outlet", { exact: true }).click();
    await page.getByRole("option", { name: contoh!.keLokasi!.nama!, exact: true }).click();
    const hasil = await isiRespons(await tunggu);
    await periksaJumlahBaris(page, hasil.filter(diOutlet).length, KOSONG);
  });

  test("tombol buat membuka halaman buat pengajuan", async ({ page }) => {
    await buka(page, URL_OUTLET, null);
    await page.getByRole("button", { name: /buat pengajuan baru/i }).click();
    await page.waitForURL(/\/pengajuanStok\/buatPengajuan$/);
  });

  test("buat: gudang asal dikirim di dariLocationID dan outlet peminta di keLocationID", async ({ page }) => {
    // POST dijawab gagal lewat page.route agar tidak ada pengajuan yang
    // tersimpan; yang diperiksa adalah isi payload.
    const polaPost = /\/api\/pengajuanstok(\?|$)/i;
    await page.route(polaPost, (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: "error", message: "uji" }) })
        : route.continue(),
    );
    await page.goto(URL_OUTLET + "/buatPengajuan", { waitUntil: "commit" });
    const rLokasi = await page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/location(\?|$)/i.test(r.url()),
    );
    const lokasi = ((await rLokasi.json()) as { data: { id?: string; _id?: string; tipe: string }[] }).data;
    const tipe = (id: string) => lokasi.find((l) => (l.id ?? l._id) === id)?.tipe;

    await page.getByText("Pilih Outlet Anda...", { exact: true }).click();
    await page.getByRole("option").first().click();
    await page.getByText("Pilih Gudang...", { exact: true }).click();
    await page.getByRole("option").first().click();
    if ((await page.getByText("Pilih...", { exact: true }).count()) === 0) {
      await page.getByRole("button", { name: /tambah baris/i }).click();
    }
    await page.getByText("Pilih...", { exact: true }).first().click();
    await page.getByRole("option").first().click();
    await page.getByPlaceholder("0").first().fill("1");

    const tPost = page.waitForRequest((r) => r.method() === "POST" && polaPost.test(r.url()));
    await page.getByRole("button", { name: "Simpan sebagai Draft" }).click();
    const payload = (await tPost).postDataJSON() as { dariLocationID: string; keLocationID: string };
    expect(tipe(payload.dariLocationID)).toBe("Gudang");
    expect(tipe(payload.keLocationID)).toBe("Outlet");
    await expect(page.getByText("Gagal Menyimpan")).toBeVisible();
    await page.unroute(polaPost);
  });

  test("tombol pada baris membuka detail pengajuan itu", async ({ page }) => {
    const data = (await buka(page, URL_OUTLET, null)).filter(diOutlet);
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

  test("pencarian nama outlet peminta menyaring baris", async ({ page }) => {
    const data = (await bukaSemua(page)).filter(diGudang);
    const contoh = data.find((p) => p.keLokasi?.nama);
    test.skip(!contoh, "Belum ada pengajuan dengan outlet peminta");
    const kata = contoh!.keLokasi!.nama!;
    await page.getByPlaceholder("Cari No. Pengajuan / Outlet...").fill(kata);
    const kecil = kata.toLowerCase();
    const harapan = data.filter(
      (p) => p.nomorPengajuan.toLowerCase().includes(kecil) || (p.keLokasi?.nama ?? "").toLowerCase().includes(kecil),
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
