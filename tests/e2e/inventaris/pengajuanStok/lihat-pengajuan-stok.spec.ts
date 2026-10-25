import { test, expect, Page, Response } from "@playwright/test";
import { ADA_IZIN_LINTAS, JALUR_TERKUNCI, MENUNGGU_IZIN_LINTAS } from "../../../helpers/lintas-outlet";

type LokasiMentah = { id?: string; _id?: string; nama: string; tipe: string };

const URL_OUTLET = "http://localhost:3000/dashboard/outlet/inventaris/pengajuanStok";
const URL_GUDANG = "http://localhost:3000/dashboard/gudang/pengajuanStok";

type PengajuanMentah = {
  id: string;
  nomorPengajuan: string;
  status: string;
  dariLokasi: { id?: string; nama?: string; tipe?: string } | null;
  keLokasi: { id?: string; nama?: string; tipe?: string } | null;
  /** Kosong atau tidak ada setelah surat jalan dibatalkan (transferStokService $unset). */
  transferStokID?: unknown;
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

/** Ukuran halaman awal tabel pengajuan; baris di luar halaman pertama dibuktikan lewat kaki tabel. */
const UKURAN_AWAL = 10;

async function periksaJumlahBaris(page: Page, jumlah: number, pesanKosong: string) {
  const baris = page.locator("table tbody tr");
  if (jumlah === 0) {
    await expect(page.getByText(pesanKosong)).toBeVisible();
  } else {
    await expect(baris).toHaveCount(Math.min(jumlah, UKURAN_AWAL));
  }
  await expect(page.getByText(`${jumlah} total data`, { exact: true })).toBeVisible();
}

// Arah backend: dariLokasi adalah gudang asal barang dan keLokasi outlet
// peminta (features/pengajuan-stok/arah.ts). Pengajuan terbalik tidak tampil.
const arahBenar = (p: PengajuanMentah) => p.dariLokasi?.tipe === "Gudang" && p.keLokasi?.tipe === "Outlet";
const diOutlet = (p: PengajuanMentah) => arahBenar(p);
// Ruang gudang: tanpa draf, karena draf tidak pernah tampil (keputusan produk).
const diGudang = (p: PengajuanMentah) => arahBenar(p) && p.status !== "DRAFT";
// Disetujui: APPROVED, atau PENDING karena surat jalannya dibatalkan (features/pengajuan-stok/tahap.ts).
const disetujui = (p: PengajuanMentah) => p.status === "APPROVED" || p.status === "PENDING";
const perluSuratJalan = (p: PengajuanMentah) => disetujui(p) && !p.transferStokID;

/** Catat permintaan daftar pengajuan yang membawa parameter status. */
function catatPermintaanBerstatus(page: Page): string[] {
  const status: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" || !/\/api\/pengajuanstok(\?|$)/i.test(r.url())) return;
    const s = new URL(r.url()).searchParams.get("status");
    if (s) status.push(s);
  });
  return status;
}

// ============================================================
// OUTLET
// ============================================================
test.describe("Daftar pengajuan stok outlet", () => {
  const KOSONG = "Tidak ada data pengajuan stok";

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("bawaan Semua: tanpa filter status, pengajuan dari outlet", async ({ page }) => {
    const data = await buka(page, URL_OUTLET, null);
    await expect(page.getByRole("heading", { name: "Pengajuan Stok Barang" })).toBeVisible();
    await periksaJumlahBaris(page, data.filter(diOutlet).length, KOSONG);
  });

  test("tab status mengirim status ke server dan menampilkan hasilnya", async ({ page }) => {
    await buka(page, URL_OUTLET, null);
    const tunggu = page.waitForResponse(daftarPengajuan("SUBMITTED"));
    // Di ruang outlet, tab SUBMITTED berlabel "Menunggu Persetujuan".
    await page.getByRole("button", { name: "Menunggu Persetujuan", exact: true }).click();
    const data = await isiRespons(await tunggu);
    expect(data.every((p) => p.status === "SUBMITTED")).toBe(true);
    await periksaJumlahBaris(page, data.filter(diOutlet).length, KOSONG);
  });

  test("tab DISETUJUI: tanpa filter status, APPROVED dan PENDING berlabel Disetujui", async ({ page }) => {
    const data = await buka(page, URL_OUTLET, null);
    const berstatus = catatPermintaanBerstatus(page);
    await page.getByRole("button", { name: "Disetujui", exact: true }).click();
    await periksaJumlahBaris(page, data.filter((p) => diOutlet(p) && disetujui(p)).length, KOSONG);
    await expect(page.locator("table tbody tr", { hasText: "Menunggu" })).toHaveCount(0);
    expect(berstatus).toEqual([]);
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

  test("lintas outlet: pilih satu outlet mengirim locationID outlet itu", async ({ page }) => {
    test.fixme(!ADA_IZIN_LINTAS, MENUNGGU_IZIN_LINTAS);
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

  test("buat tanpa izin lintas outlet: outlet peminta terkunci ke outlet tenant dan gudang asal di dariLocationID", async ({ page }) => {
    test.skip(ADA_IZIN_LINTAS, JALUR_TERKUNCI);
    // POST dijawab gagal lewat page.route agar tidak ada pengajuan yang
    // tersimpan; yang diperiksa adalah isi payload.
    const polaPost = /\/api\/pengajuanstok(\?|$)/i;
    await page.route(polaPost, (route) =>
      route.request().method() === "POST"
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: "error", message: "uji" }) })
        : route.continue(),
    );
    await page.goto(URL_OUTLET + "/buatPengajuan", { waitUntil: "commit" });
    const tAktif = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/location\/current(\?|$)/i.test(r.url()),
    );
    const tLokasi = page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/location(\?|$)/i.test(r.url()),
    );
    const aktif = ((await (await tAktif).json()) as { data: LokasiMentah | null }).data;
    const lokasi = ((await (await tLokasi).json()) as { data: LokasiMentah[] }).data;
    expect(aktif, "outlet tenant dari /location/current").not.toBeNull();
    const idAktif = aktif!.id ?? aktif!._id;
    const tipe = (id: string) => lokasi.find((l) => (l.id ?? l._id) === id)?.tipe;

    const pemilihOutlet = page.locator("#pengajuan-outlet");
    await expect(pemilihOutlet).toBeDisabled();
    await expect(pemilihOutlet).toContainText(aktif!.nama);
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
    expect(payload.keLocationID).toBe(idAktif);
    expect(tipe(payload.dariLocationID)).toBe("Gudang");
    expect(tipe(payload.keLocationID)).toBe("Outlet");
    await expect(page.getByText("Gagal Menyimpan")).toBeVisible();
    await page.unroute(polaPost);
  });

  test("buat dengan izin lintas outlet: outlet peminta dipilih dan dikirim di keLocationID", async ({ page }) => {
    test.fixme(!ADA_IZIN_LINTAS, MENUNGGU_IZIN_LINTAS);
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
    const lokasi = ((await rLokasi.json()) as { data: LokasiMentah[] }).data;
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

  test("menu titik tiga pada baris membuka detail pengajuan itu (P-A)", async ({ page }) => {
    const data = (await buka(page, URL_OUTLET, null)).filter(diOutlet);
    test.skip(data.length === 0, "Belum ada pengajuan stok");
    const baris = page.locator("table tbody tr").first();
    await baris.getByRole("button", { name: "Buka menu" }).click();
    const harapan = data[0].status === "DRAFT" ? "Lanjutkan draft" : "Lihat detail";
    await page.getByRole("menuitem", { name: harapan }).click();
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

  test("bawaan Perlu Disetujui: mengirim status SUBMITTED", async ({ page }) => {
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

  test("tab Perlu Surat Jalan: tanpa filter status, hanya pengajuan disetujui yang belum punya surat jalan", async ({ page }) => {
    await buka(page, URL_GUDANG, "SUBMITTED");
    const tunggu = page.waitForResponse(daftarPengajuan(null));
    await page.getByRole("button", { name: "Perlu Surat Jalan", exact: true }).click();
    const data = await isiRespons(await tunggu);
    const perlu = data.filter((p) => diGudang(p) && perluSuratJalan(p));
    await periksaJumlahBaris(page, perlu.length, KOSONG);
    if (perlu.length > 0) {
      await expect(page.locator("table tbody tr").filter({ hasNotText: "Perlu Surat Jalan" })).toHaveCount(0);
    }
  });

  test("detail pengajuan PENDING tanpa surat jalan menampilkan tombol buat surat jalan", async ({ page }) => {
    // Keadaan setelah surat jalan dibatalkan: status PENDING dan transferStokID dihapus
    // (transferStokService baris 654 sampai 655). Tombol tidak diklik (strategi data uji A).
    await page.route(/\/api\/pengajuanstok\/[0-9a-f]{24}(\?|$)/i, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const respons = await route.fetch();
      const isi = (await respons.json()) as { data: Record<string, unknown> };
      isi.data.status = "PENDING";
      isi.data.transferStokID = null;
      await route.fulfill({ response: respons, json: isi });
    });
    const data = await bukaSemua(page);
    test.skip(data.filter(diGudang).length === 0, "Tidak ada pengajuan berarah benar di ruang gudang.");
    await page.locator("table tbody tr").first().getByRole("button", { name: "Buka menu" }).click();
    await page.getByRole("menuitem", { name: "Tinjau" }).click();
    await page.waitForURL(/\/dashboard\/gudang\/pengajuanStok\/[0-9a-f]{24}/i);
    await expect(page.getByText("Perlu Surat Jalan", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buat Surat Jalan" })).toBeVisible();
  });

  test("?tab=perlu-surat-jalan membuka tab itu; klik tab menulis ?tab=, tab bawaan menghapusnya", async ({ page }) => {
    await buka(page, `${URL_GUDANG}?tab=perlu-surat-jalan`, null);
    await expect(page.getByRole("button", { name: "Perlu Surat Jalan", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Semua", exact: true }).click();
    await expect(page).toHaveURL(`${URL_GUDANG}?tab=semua`);
    await expect(page.getByRole("button", { name: "Semua", exact: true })).toHaveAttribute("aria-pressed", "true");
    const tunggu = page.waitForResponse(daftarPengajuan("SUBMITTED"));
    await page.getByRole("button", { name: "Perlu Disetujui", exact: true }).click();
    await tunggu;
    await expect(page).toHaveURL(URL_GUDANG);
  });

  test("?tab= yang tidak dikenal kembali ke tab bawaan tanpa menampilkan nilainya", async ({ page }) => {
    const nilai = "<b>ujitab</b>__proto__";
    await buka(page, `${URL_GUDANG}?tab=${encodeURIComponent(nilai)}`, "SUBMITTED");
    await expect(page.getByRole("button", { name: "Perlu Disetujui", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("ujitab")).toHaveCount(0);
    await expect(page.locator("b", { hasText: "ujitab" })).toHaveCount(0);
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

  test("menu Tinjau pada baris membuka detail pengajuan itu (P-A)", async ({ page }) => {
    const data = (await bukaSemua(page)).filter(diGudang);
    test.skip(data.length === 0, "Belum ada pengajuan stok");
    await page.locator("table tbody tr").first().getByRole("button", { name: "Buka menu" }).click();
    await page.getByRole("menuitem", { name: "Tinjau" }).click();
    await page.waitForURL(new RegExp(`/dashboard/gudang/pengajuanStok/${data[0].id}$`));
  });
});
