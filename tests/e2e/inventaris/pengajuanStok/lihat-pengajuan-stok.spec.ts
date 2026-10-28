import { test, expect, Page, Response } from "@playwright/test";
import { ADA_IZIN_LINTAS, JALUR_TERKUNCI, MENUNGGU_IZIN_LINTAS } from "../../../helpers/lintas-outlet";
import { LABEL_ARAH_PENGAJUAN } from "../../../../features/pengajuan-stok/tampilan";

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
// Daftar berhalaman di server (B104, B108, B109, B110): tab, arah, lokasi,
// dan pencarian dikirim sebagai query, dan kaki tabel memakai
// pagination.total. Harapan tidak lagi dihitung ulang dari respons di klien.
type Kueri = Record<string, string | null>;

/** Respons daftar yang query-nya memuat nilai yang diharapkan; null berarti parameter tidak ada. */
function daftarPengajuan(harap: Kueri) {
  return (r: Response) => {
    if (r.request().method() !== "GET" || !/\/api\/pengajuanstok(\?|$)/i.test(r.url())) return false;
    const q = new URL(r.url()).searchParams;
    return Object.entries(harap).every(([k, v]) => q.get(k) === v);
  };
}

type HalamanMentah = { data: PengajuanMentah[]; total: number };

async function isiRespons(r: Response): Promise<HalamanMentah> {
  expect(r.status()).toBe(200);
  const body = (await r.json()) as { data: PengajuanMentah[]; pagination?: { total: number } };
  expect(body.pagination, "daftar berhalaman memuat pagination").toBeTruthy();
  return { data: body.data, total: body.pagination!.total };
}

/** Buka halaman dan tangkap halaman pertama yang dimuatnya sendiri. */
async function buka(page: Page, url: string, harap: Kueri) {
  await page.goto(url, { waitUntil: "commit" });
  return isiRespons(await page.waitForResponse(daftarPengajuan({ page: "1", limit: "10", ...harap })));
}

/** Baris tabel sama dengan isi halaman dari server, dan kaki tabel dengan pagination.total. */
async function periksaHalaman(page: Page, h: HalamanMentah, pesanKosong: string) {
  const baris = page.locator("table tbody tr");
  if (h.total === 0) {
    await expect(page.getByText(pesanKosong)).toBeVisible();
  } else {
    await expect(baris).toHaveCount(h.data.length);
    await expect(baris.first()).toContainText(h.data[0].nomorPengajuan);
  }
  await expect(page.getByText(`${h.total} total data`, { exact: true })).toBeVisible();
}

const permintaan = (p: PengajuanMentah) => p.dariLokasi?.tipe === "Gudang" && p.keLokasi?.tipe === "Outlet";
const pengembalian = (p: PengajuanMentah) => p.dariLokasi?.tipe === "Outlet" && p.keLokasi?.tipe === "Gudang";
/** Nama outlet di sisi mana pun: peminta pada permintaan, asal pada pengembalian. */
const namaOutlet = (p: PengajuanMentah) => (p.dariLokasi?.tipe === "Outlet" ? p.dariLokasi : p.keLokasi)?.nama ?? "";
// Disetujui: APPROVED, atau PENDING karena surat jalannya dibatalkan (features/pengajuan-stok/tahap.ts).
const disetujui = (p: PengajuanMentah) => p.status === "APPROVED" || p.status === "PENDING";
/** Tab Semua gudang: seluruh status selain draf (STATUS_TANPA_DRAF), bagi Owner yang tidak dibatasi. */
const STATUS_GUDANG_SEMUA = "SUBMITTED,APPROVED,PENDING,REJECTED,COMPLETED";

// ============================================================
// OUTLET
// ============================================================
test.describe("Daftar pengajuan stok outlet", () => {
  const KOSONG = "Tidak ada data pengajuan stok";

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("bawaan Semua: tanpa filter status, halaman pertama dari server", async ({ page }) => {
    const h = await buka(page, URL_OUTLET, { status: null });
    await expect(page.getByRole("heading", { name: "Pengajuan Stok Barang" })).toBeVisible();
    await periksaHalaman(page, h, KOSONG);
  });

  test("tab status mengirim status ke server dan kembali ke halaman 1", async ({ page }) => {
    await buka(page, URL_OUTLET, { status: null });
    const tunggu = page.waitForResponse(daftarPengajuan({ status: "SUBMITTED", page: "1" }));
    // Di ruang outlet, tab SUBMITTED berlabel "Menunggu Persetujuan".
    await page.getByRole("button", { name: "Menunggu Persetujuan", exact: true }).click();
    const h = await isiRespons(await tunggu);
    expect(h.data.every((p) => p.status === "SUBMITTED")).toBe(true);
    await periksaHalaman(page, h, KOSONG);
  });

  test("tab DISETUJUI mengirim APPROVED dan PENDING sekaligus (B110), berlabel Disetujui", async ({ page }) => {
    await buka(page, URL_OUTLET, { status: null });
    const tunggu = page.waitForResponse(daftarPengajuan({ status: "APPROVED,PENDING", page: "1" }));
    await page.getByRole("button", { name: "Disetujui", exact: true }).click();
    const h = await isiRespons(await tunggu);
    expect(h.data.every(disetujui)).toBe(true);
    await periksaHalaman(page, h, KOSONG);
    await expect(page.locator("table tbody tr", { hasText: "Menunggu" })).toHaveCount(0);
  });

  test("pencarian nomor pengajuan dikirim ke server (B108)", async ({ page }) => {
    const awal = await buka(page, URL_OUTLET, { status: null });
    test.skip(awal.data.length === 0, "Belum ada pengajuan stok");
    const kata = awal.data[0].nomorPengajuan;
    const tunggu = page.waitForResponse(daftarPengajuan({ cari: kata, page: "1" }));
    await page.getByPlaceholder("Cari No. Pengajuan...").fill(kata);
    const h = await isiRespons(await tunggu);
    expect(h.data.map((p) => p.nomorPengajuan)).toContain(kata);
    await periksaHalaman(page, h, KOSONG);
  });

  test("filter arah pengembalian dikirim sebagai dariTipeLokasi Outlet (B109)", async ({ page }) => {
    await buka(page, URL_OUTLET, { status: null });
    const tunggu = page.waitForResponse(daftarPengajuan({ dariTipeLokasi: "Outlet", page: "1" }));
    await page.getByRole("combobox", { name: "Filter arah" }).click();
    await page.getByRole("option", { name: LABEL_ARAH_PENGAJUAN.OUTLET_KE_GUDANG, exact: true }).click();
    const h = await isiRespons(await tunggu);
    expect(h.data.every(pengembalian)).toBe(true);
    await periksaHalaman(page, h, KOSONG);
  });

  test("lintas outlet: pilih satu outlet mengirim locationID outlet itu", async ({ page }) => {
    test.fixme(!ADA_IZIN_LINTAS, MENUNGGU_IZIN_LINTAS);
    const awal = await buka(page, URL_OUTLET, { status: null });
    const contoh = awal.data.find((p) => p.keLokasi?.id && p.keLokasi?.nama);
    test.skip(!contoh, "Belum ada pengajuan outlet");
    const idOutlet = contoh!.keLokasi!.id!;
    const tunggu = page.waitForResponse(daftarPengajuan({ locationID: idOutlet, page: "1" }));
    await page.getByText("Semua Outlet", { exact: true }).click();
    await page.getByRole("option", { name: contoh!.keLokasi!.nama!, exact: true }).click();
    await periksaHalaman(page, await isiRespons(await tunggu), KOSONG);
  });

  test("tombol buat membuka halaman buat pengajuan", async ({ page }) => {
    await buka(page, URL_OUTLET, { status: null });
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
    const h = await buka(page, URL_OUTLET, { status: null });
    test.skip(h.data.length === 0, "Belum ada pengajuan stok");
    const baris = page.locator("table tbody tr").first();
    await baris.getByRole("button", { name: "Buka menu" }).click();
    const harapan = h.data[0].status === "DRAFT" ? "Lanjutkan draft" : "Lihat detail";
    await page.getByRole("menuitem", { name: harapan }).click();
    await page.waitForURL(new RegExp(`/dashboard/outlet/inventaris/pengajuanStok/${h.data[0].id}$`));
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
    await buka(page, URL_GUDANG, { status: "SUBMITTED" });
    const tunggu = page.waitForResponse(daftarPengajuan({ status: STATUS_GUDANG_SEMUA, page: "1" }));
    await page.getByRole("button", { name: "Semua", exact: true }).click();
    return isiRespons(await tunggu);
  }

  test("bawaan Perlu Disetujui: mengirim status SUBMITTED", async ({ page }) => {
    const h = await buka(page, URL_GUDANG, { status: "SUBMITTED" });
    await expect(page.getByRole("heading", { name: /inbox permintaan stok/i })).toBeVisible();
    expect(h.data.every((p) => p.status === "SUBMITTED")).toBe(true);
    await periksaHalaman(page, h, KOSONG);
  });

  test("tab Semua mengirim seluruh status selain draf", async ({ page }) => {
    const h = await bukaSemua(page);
    expect(h.data.every((p) => p.status !== "DRAFT")).toBe(true);
    await periksaHalaman(page, h, KOSONG);
  });

  test("tab Perlu Surat Jalan: permintaan disetujui yang belum punya surat jalan, disaring server (B110, AR6a)", async ({ page }) => {
    await buka(page, URL_GUDANG, { status: "SUBMITTED" });
    const tunggu = page.waitForResponse(
      daftarPengajuan({ status: "APPROVED,PENDING", suratJalan: "belum", dariTipeLokasi: "Gudang", page: "1" }),
    );
    await page.getByRole("button", { name: "Perlu Surat Jalan", exact: true }).click();
    const h = await isiRespons(await tunggu);
    expect(h.data.every((p) => disetujui(p) && !p.transferStokID && permintaan(p))).toBe(true);
    await periksaHalaman(page, h, KOSONG);
    if (h.total > 0) {
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
      // simulasi: PENDING tanpa surat jalan hanya muncul setelah surat jalan dibatalkan; spec tidak membatalkan surat jalan (strategi data uji A)
      await route.fulfill({ response: respons, json: isi });
    });
    const h = await bukaSemua(page);
    // Baris pertama tidak selalu permintaan sejak P8; sisi pengembalian diuji di skenario berikutnya.
    const sasaran = h.data.find(permintaan);
    test.skip(!sasaran, "Tidak ada permintaan di halaman pertama ruang gudang.");
    await page.locator("table tbody tr", { hasText: sasaran!.nomorPengajuan }).getByRole("button", { name: "Buka menu" }).click();
    await page.getByRole("menuitem", { name: "Tinjau" }).click();
    await page.waitForURL(/\/dashboard\/gudang\/pengajuanStok\/[0-9a-f]{24}/i);
    await expect(page.getByText("Perlu Surat Jalan", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buat Surat Jalan" })).toBeVisible();
  });

  test("detail pengembalian PENDING tanpa surat jalan: menunggu surat jalan outlet, tanpa tombol buat surat jalan (AR2a, AR6a)", async ({ page }) => {
    await page.route(/\/api\/pengajuanstok\/[0-9a-f]{24}(\?|$)/i, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const respons = await route.fetch();
      const isi = (await respons.json()) as { data: Record<string, unknown> };
      isi.data.status = "PENDING";
      isi.data.transferStokID = null;
      // simulasi: PENDING tanpa surat jalan muncul setelah surat jalan pengembalian dibatalkan dari ruang outlet, yang belum ada di web
      await route.fulfill({ response: respons, json: isi });
    });
    const h = await bukaSemua(page);
    const sasaran = h.data.find(pengembalian);
    test.skip(!sasaran, "Tidak ada pengembalian di halaman pertama ruang gudang.");
    await page.locator("table tbody tr", { hasText: sasaran!.nomorPengajuan }).getByRole("button", { name: "Buka menu" }).click();
    await page.getByRole("menuitem", { name: "Tinjau" }).click();
    await page.waitForURL(/\/dashboard\/gudang\/pengajuanStok\/[0-9a-f]{24}/i);
    await expect(page.getByText("Menunggu Surat Jalan Outlet", { exact: true })).toBeVisible();
    await expect(page.getByText(/outlet yang membuat dan mengirim surat jalannya/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Buat Surat Jalan" })).toHaveCount(0);
  });

  test("?tab=perlu-surat-jalan membuka tab itu; klik tab menulis ?tab=, tab bawaan menghapusnya", async ({ page }) => {
    await buka(page, `${URL_GUDANG}?tab=perlu-surat-jalan`, { status: "APPROVED,PENDING", suratJalan: "belum" });
    await expect(page.getByRole("button", { name: "Perlu Surat Jalan", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Semua", exact: true }).click();
    await expect(page).toHaveURL(`${URL_GUDANG}?tab=semua`);
    await expect(page.getByRole("button", { name: "Semua", exact: true })).toHaveAttribute("aria-pressed", "true");
    const tunggu = page.waitForResponse(daftarPengajuan({ status: "SUBMITTED" }));
    await page.getByRole("button", { name: "Perlu Disetujui", exact: true }).click();
    await tunggu;
    await expect(page).toHaveURL(URL_GUDANG);
  });

  test("?tab= yang tidak dikenal kembali ke tab bawaan tanpa menampilkan nilainya", async ({ page }) => {
    const nilai = "<b>ujitab</b>__proto__";
    await buka(page, `${URL_GUDANG}?tab=${encodeURIComponent(nilai)}`, { status: "SUBMITTED" });
    await expect(page.getByRole("button", { name: "Perlu Disetujui", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("ujitab")).toHaveCount(0);
    await expect(page.locator("b", { hasText: "ujitab" })).toHaveCount(0);
  });

  test("pencarian nama outlet dikirim ke server dan mencocokkan lokasi asal maupun tujuan (B108)", async ({ page }) => {
    const awal = await bukaSemua(page);
    const contoh = awal.data.find((p) => namaOutlet(p));
    test.skip(!contoh, "Belum ada pengajuan dengan nama outlet");
    const kata = namaOutlet(contoh!);
    const tunggu = page.waitForResponse(daftarPengajuan({ cari: kata, status: STATUS_GUDANG_SEMUA, page: "1" }));
    await page.getByPlaceholder("Cari No. Pengajuan / Outlet...").fill(kata);
    const h = await isiRespons(await tunggu);
    const kecil = kata.toLowerCase();
    const cocok = (p: PengajuanMentah) =>
      [p.nomorPengajuan, p.dariLokasi?.nama ?? "", p.keLokasi?.nama ?? ""].some((t) => t.toLowerCase().includes(kecil));
    expect(h.data.length).toBeGreaterThan(0);
    expect(h.data.every(cocok)).toBe(true);
    await periksaHalaman(page, h, KOSONG);
  });

  test("menu Tinjau pada baris membuka detail pengajuan itu (P-A)", async ({ page }) => {
    const h = await bukaSemua(page);
    test.skip(h.data.length === 0, "Belum ada pengajuan stok");
    await page.locator("table tbody tr").first().getByRole("button", { name: "Buka menu" }).click();
    await page.getByRole("menuitem", { name: "Tinjau" }).click();
    await page.waitForURL(new RegExp(`/dashboard/gudang/pengajuanStok/${h.data[0].id}$`));
  });
});
