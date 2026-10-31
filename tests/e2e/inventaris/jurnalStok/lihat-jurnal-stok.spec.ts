import { test, expect, Page, Response } from "@playwright/test";
import { ADA_IZIN_LINTAS, MENUNGGU_IZIN_LINTAS } from "../../../helpers/lintas-outlet";

const URL_OUTLET = "http://localhost:3000/dashboard/outlet/inventaris/jurnalStok";
const URL_GUDANG = "http://localhost:3000/dashboard/gudang/jurnalStok";

type Relasi = { _id?: string; id?: string };
type JurnalMentah = Relasi & {
  tipeKoreksi: "Masuk" | "Keluar";
  alasan: string;
  bahanBakuID: (Relasi & { namaBahan: string }) | null;
  locationID: (Relasi & { tipe: string; nama?: string }) | null;
  tanggal: string;
  dicatatOleh: { nama?: string } | null;
};
type HalamanMentah = {
  data: JurnalMentah[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
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
// HELPER: Respons server sebagai sumber data uji
// ============================================================
function responsGet(pola: RegExp) {
  return (r: Response) => r.request().method() === "GET" && pola.test(r.url());
}

function idDari(x: Relasi | null | undefined) {
  return x?._id ?? x?.id;
}

function isiData<T>(body: unknown): T {
  return (body as { data: T }).data;
}

const POLA_JURNAL = /\/api\/jurnalstok(\?|$)/i;

/** Ukuran halaman awal tabel jurnal (pilihan ukuran pertama). */
const UKURAN_AWAL = 10;

/** Periode awal halaman: tanggal 1 bulan berjalan sampai hari ini, sebagai YYYY-MM-DD. */
const kini = new Date();
const awalanBulan = `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, "0")}-`;
const AWAL_BULAN = awalanBulan + "01";
const HARI_INI = awalanBulan + String(kini.getDate()).padStart(2, "0");

/** Menunggu GET /jurnalstok berikutnya yang query-nya memenuhi syarat. */
function tungguJurnal(page: Page, syarat: (q: URLSearchParams) => boolean = () => true) {
  return page.waitForResponse(
    (r) => r.request().method() === "GET" && POLA_JURNAL.test(r.url()) && syarat(new URL(r.url()).searchParams),
  );
}

/** Isi satu halaman respons beserta query permintaannya. */
async function bacaHalaman(r: Response) {
  expect(r.status(), r.url()).toBe(200);
  const isi = (await r.json()) as HalamanMentah;
  return { ...isi, query: new URL(r.url()).searchParams };
}

/** Membuka halaman jurnal dan mengembalikan halaman pertama dari server beserta query-nya. */
async function bukaJurnal(page: Page, url: string, tungguLokasi = false) {
  const tJurnal = tungguJurnal(page);
  const tLokasi = tungguLokasi
    ? page.waitForResponse(responsGet(/\/api\/location\/current(\?|$)/))
    : null;
  await page.goto(url);

  const halaman = await bacaHalaman(await tJurnal);

  let lokasiAktif: string | undefined;
  if (tLokasi) {
    const rLokasi = await tLokasi;
    const data = isiData<Relasi | Relasi[] | null>(await rLokasi.json());
    lokasiAktif = idDari(Array.isArray(data) ? data[0] : data);
  }

  await expect(page.getByRole("heading", { name: /buku jurnal stok/i })).toBeVisible();
  return { ...halaman, lokasiAktif };
}

function barisTabel(page: Page) {
  return page.locator("table tbody tr");
}

/** Nama bahan jurnal mentah; kosong bila bahannya terhapus dari master. */
function namaBahan(j: unknown): string {
  return (j as { bahanBakuID?: { namaBahan?: string } | null }).bahanBakuID?.namaBahan ?? "";
}

/** Isi tabel sama dengan halaman respons: jumlah baris dan total data dari pagination. */
async function periksaHalaman(page: Page, halaman: HalamanMentah) {
  if (halaman.data.length === 0) {
    await expect(barisTabel(page)).toHaveCount(1);
    await expect(barisTabel(page).first()).toContainText(/kosong|tidak ada catatan/i);
  } else {
    await expect(barisTabel(page)).toHaveCount(halaman.data.length);
  }
  await expect(page.getByText(`${halaman.pagination.total} total data`, { exact: true })).toBeVisible();
}

// ============================================================
// SKENARIO
// ============================================================
test.describe("Jurnal stok", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("outlet: halaman pertama bulan berjalan untuk satu lokasi outlet, tanpa jurnal gudang", async ({ page }) => {
    const halaman = await bukaJurnal(page, URL_OUTLET, !ADA_IZIN_LINTAS);
    expect(halaman.query.get("dari")).toBe(AWAL_BULAN);
    expect(halaman.query.get("sampai")).toBe(HARI_INI);
    expect(halaman.query.get("page")).toBe("1");
    expect(halaman.query.get("limit")).toBe(String(UKURAN_AWAL));
    const lokasi = halaman.query.get("locationID");
    if (halaman.lokasiAktif) expect(lokasi).toBe(halaman.lokasiAktif);
    else expect(lokasi).toBeTruthy();
    expect(
      halaman.data.every((j) => idDari(j.locationID) === lokasi && j.locationID?.tipe === "Outlet"),
    ).toBe(true);
    await periksaHalaman(page, halaman);
  });

  test("lintas outlet: pilih satu outlet mengirim locationID outlet itu", async ({ page }) => {
    test.fixme(!ADA_IZIN_LINTAS, MENUNGGU_IZIN_LINTAS);
    // Semua Outlet memakai satu-satunya outlet (lokasiSatuOutlet), sehingga
    // dengan satu outlet permintaan ber-locationID itu sudah terkirim saat
    // halaman dimuat dan memilihnya tidak memicu permintaan baru. Karena itu
    // seluruh respons jurnal dicatat sejak halaman dimuat.
    const jurnal: Response[] = [];
    page.on("response", (r) => {
      if (r.request().method() === "GET" && POLA_JURNAL.test(r.url())) jurnal.push(r);
    });
    // Penunggu dipasang setelah commit, agar tidak menangkap respons halaman sesudah login.
    await page.goto(URL_OUTLET, { waitUntil: "commit" });
    const tLokasi = page.waitForResponse(responsGet(/\/api\/location(\?|$)/));
    const lokasi = isiData<(Relasi & { tipe: string; nama: string })[]>(await (await tLokasi).json());
    const target = lokasi.find((l) => l.tipe === "Outlet");
    test.skip(!target, "Tenant uji belum punya outlet");

    await page.getByText("Semua Outlet", { exact: true }).click();
    await page.getByRole("option", { name: target!.nama, exact: true }).click();
    const tersaring = (r: Response) => new URL(r.url()).searchParams.get("locationID") === idDari(target);
    await expect.poll(() => jurnal.some(tersaring)).toBe(true);
    await periksaHalaman(page, await bacaHalaman(jurnal.filter(tersaring).at(-1)!));
  });

  test("outlet: filter arah dikirim sebagai tipeKoreksi dan kembali ke halaman 1", async ({ page }) => {
    await bukaJurnal(page, URL_OUTLET);
    const tKeluar = tungguJurnal(page, (q) => q.get("tipeKoreksi") === "Keluar" && q.get("page") === "1");
    await page.getByText("Semua Arah", { exact: true }).click();
    await page.getByRole("option", { name: "Barang Keluar" }).click();

    const halaman = await bacaHalaman(await tKeluar);
    expect(halaman.data.every((j) => j.tipeKoreksi === "Keluar")).toBe(true);
    await periksaHalaman(page, halaman);
  });

  test("outlet: filter alasan dikirim ke server", async ({ page }) => {
    await bukaJurnal(page, URL_OUTLET);
    const tAlasan = tungguJurnal(page, (q) => q.get("alasan") === "Stok Opname" && q.get("page") === "1");
    await page.getByText("Semua Alasan", { exact: true }).click();
    await page.getByRole("option", { name: "Stok Opname" }).click();

    const halaman = await bacaHalaman(await tAlasan);
    expect(halaman.data.every((j) => j.alasan === "Stok Opname")).toBe(true);
    await periksaHalaman(page, halaman);
  });

  test("outlet: pencarian nama bahan dikirim ke server dan dikosongkan Reset Filter (B108)", async ({ page }) => {
    const awal = await bukaJurnal(page, URL_OUTLET);
    const kata = awal.data.map(namaBahan).find(Boolean);
    test.skip(!kata, "Belum ada jurnal outlet bulan ini dengan bahan yang masih ada");

    const tCari = tungguJurnal(page, (q) => q.get("cari") === kata && q.get("page") === "1");
    await page.getByLabel("Cari bahan").fill(kata!);
    const hasil = await bacaHalaman(await tCari);
    expect(hasil.data.length).toBeGreaterThan(0);
    expect(hasil.data.every((j) => namaBahan(j).toLowerCase().includes(kata!.toLowerCase()))).toBe(true);
    await periksaHalaman(page, hasil);

    await page.getByRole("button", { name: "Reset Filter" }).click();
    await expect(page.getByLabel("Cari bahan")).toHaveValue("");
    await expect(page.getByText(awal.pagination.total + " total data", { exact: true })).toBeVisible();
  });

  test("outlet: periode dikirim sebagai tanggal YYYY-MM-DD, dan Reset Filter mengembalikan bulan berjalan", async ({ page }) => {
    const hari = Math.min(kini.getDate(), 15);
    test.skip(hari < 8, "Awal bulan: tanggal uji 8 sampai 15 belum lewat");
    const awal = await bukaJurnal(page, URL_OUTLET);
    const dari = awalanBulan + String(hari).padStart(2, "0");

    const tDari = tungguJurnal(page, (q) => q.get("dari") === dari && q.get("sampai") === HARI_INI);
    await page.getByRole("button", { name: /^Dari tanggal, / }).click();
    await page.getByRole("grid").getByText(String(hari), { exact: true }).click();
    await expect(page.getByRole("grid")).toHaveCount(0);
    const periode = await bacaHalaman(await tDari);
    expect(periode.query.get("page")).toBe("1");
    expect(periode.pagination.total).toBeLessThanOrEqual(awal.pagination.total);
    await periksaHalaman(page, periode);

    await page.getByRole("button", { name: "Reset Filter" }).click();
    await expect(page.getByRole("button", { name: /^Dari tanggal, 01 / })).toBeVisible();
    await expect(page.getByText(`${awal.pagination.total} total data`, { exact: true })).toBeVisible();
  });

  test("outlet: menu titik tiga membuka rincian jurnal beserta pencatatnya (J-A)", async ({ page }) => {
    const halaman = await bukaJurnal(page, URL_OUTLET);
    test.skip(halaman.data.length === 0, "Belum ada jurnal outlet bulan ini");
    // Baris pertama tabel adalah baris pertama respons: server mengurutkan tanggal terbaru lebih dulu.
    const pertama = halaman.data[0];

    await barisTabel(page).first().getByRole("button", { name: "Buka menu" }).click();
    await page.getByRole("menuitem", { name: "Lihat detail" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(pertama.bahanBakuID?.namaBahan || "Master Data Terhapus");
    await expect(dialog).toContainText(pertama.dicatatOleh?.nama || "Sistem Otomatis");
  });

  test("outlet: pemilih ukuran meminta 20 baris dari halaman 1", async ({ page }) => {
    const awal = await bukaJurnal(page, URL_OUTLET);
    test.skip(awal.pagination.total <= UKURAN_AWAL, "Jurnal outlet bulan ini belum lebih dari satu halaman");

    const t20 = tungguJurnal(page, (q) => q.get("limit") === "20" && q.get("page") === "1");
    await page.getByRole("combobox", { name: "Jumlah baris per halaman" }).click();
    await page.getByRole("option", { name: "20", exact: true }).click();
    await periksaHalaman(page, await bacaHalaman(await t20));
  });

  test("outlet: tombol berikutnya meminta halaman 2 dari server", async ({ page }) => {
    const awal = await bukaJurnal(page, URL_OUTLET);
    test.skip(awal.pagination.totalPages < 2, "Jurnal outlet bulan ini belum lebih dari satu halaman");

    const t2 = tungguJurnal(page, (q) => q.get("page") === "2" && q.get("limit") === String(UKURAN_AWAL));
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await periksaHalaman(page, await bacaHalaman(await t2));
    await expect(page.getByText(`Halaman 2 dari ${awal.pagination.totalPages}`, { exact: true })).toBeVisible();
  });

  test("gudang: satu lokasi gudang, hanya jurnal gudang", async ({ page }) => {
    // Penunggu dipasang setelah commit, agar permintaan lokasi milik /dashboard
    // (sidebar) yang dibuang saat berpindah halaman tidak ikut tertangkap.
    await page.goto(URL_GUDANG, { waitUntil: "commit" });
    const tLokasi = page.waitForResponse(responsGet(/\/api\/location(\?|$)/));
    const tJurnal = tungguJurnal(page);
    const lokasi = isiData<(Relasi & { tipe: string })[]>(await (await tLokasi).json());
    const halaman = await bacaHalaman(await tJurnal);
    const gudang = lokasi.find((l) => l.tipe === "Gudang");
    expect(gudang, "tenant uji punya gudang").toBeTruthy();

    expect(halaman.query.get("locationID")).toBe(idDari(gudang));
    expect(halaman.data.every((j) => j.locationID?.tipe === "Gudang")).toBe(true);
    await periksaHalaman(page, halaman);
  });

  test("gudang: gagal memuat jurnal menampilkan pesan, bukan daftar kosong", async ({ page }) => {
    const pola = POLA_JURNAL;
    await page.route(pola, (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: "error", message: "uji" }) })
        : route.continue(),
    );
    await page.goto(URL_GUDANG);
    await expect(page.getByText("Gagal memuat jurnal stok. Coba muat ulang halaman.")).toBeVisible({ timeout: 20000 });
    await page.unroute(pola);
  });

  test("outlet: gagal memuat lokasi dibedakan dari lokasi yang belum dikonfigurasi", async ({ page }) => {
    // Jalur terkunci memakai /location/current, pemegang izin lintas outlet memakai daftar lokasi.
    const pola = ADA_IZIN_LINTAS ? "**/api/location" : "**/api/location/current";
    await page.route(pola, (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: "error", message: "uji" }) })
        : route.continue(),
    );
    await page.goto(URL_OUTLET);
    await expect(page.getByText("Gagal Memuat Lokasi Outlet")).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Identitas Outlet Tidak Ditemukan")).toHaveCount(0);
    await page.unroute(pola);
  });
});