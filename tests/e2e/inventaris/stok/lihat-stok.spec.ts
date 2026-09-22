import { test, expect, Locator, Page, Response } from "@playwright/test";
import { ADA_IZIN_LINTAS, JALUR_TERKUNCI, MENUNGGU_IZIN_LINTAS } from "../../../helpers/lintas-outlet";

const URL_OUTLET = "http://localhost:3000/dashboard/outlet/inventaris/stok";
const URL_GUDANG = "http://localhost:3000/dashboard/gudang/inventaris";
const KOSONG_OUTLET = "Tidak ada data stok yang ditemukan.";
const CATATAN_OPNAME = "Uji e2e opname tanpa selisih";

type InventoryMentah = {
  id: string;
  item: { nama: string | null } | null;
  lokasi: { id: string; nama: string | null; tipe: string | null } | null;
  stok: number;
  stokMinimum: number;
  isStokKritis: boolean;
};
type LokasiMentah = { id?: string; _id?: string; nama: string; tipe: string };

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
function getInventory(syarat?: (url: URL) => boolean) {
  return (r: Response) => {
    if (r.request().method() !== "GET") return false;
    if (!/\/api\/inventory(\?|$)/.test(r.url())) return false;
    return syarat ? syarat(new URL(r.url())) : true;
  };
}

function getLokasi(r: Response) {
  return r.request().method() === "GET" && /\/api\/location(\?|$)/.test(r.url());
}

function getLokasiAktif(r: Response) {
  return r.request().method() === "GET" && /\/api\/location\/current(\?|$)/.test(r.url());
}

/**
 * Menunggu respons dan langsung membaca isinya. Isi respons dibuang browser
 * bila halaman memuat ulang data sebelum isinya sempat dibaca.
 */
function tunggu<T>(page: Page, syarat: (r: Response) => boolean): Promise<T> {
  return page.waitForResponse(syarat).then(async (r) => {
    expect(r.status()).toBe(200);
    return ((await r.json()) as { data: T }).data;
  });
}

function diOutlet(daftar: InventoryMentah[]) {
  return daftar.filter((i) => i.lokasi?.tipe === "Outlet");
}

/** Pola angka yang menerima pemisah ribuan titik, misalnya 35000 atau 35.000. */
function polaAngka(n: number) {
  return new RegExp(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\\.?"));
}

function baris(page: Page) {
  return page.locator("table tbody tr");
}

async function periksaBaris(page: Page, jumlah: number, teksKosong?: string) {
  if (jumlah === 0 && teksKosong) {
    await expect(baris(page)).toHaveCount(1);
    await expect(baris(page).first()).toContainText(teksKosong);
  } else {
    await expect(baris(page)).toHaveCount(jumlah);
  }
}

async function bukaOutlet(page: Page) {
  // Penunggu dipasang setelah dokumen baru ter-commit, agar respons dari
  // halaman sebelumnya (dashboard setelah login) tidak ikut tertangkap.
  // Pemegang izin lintas outlet memuat stok seluruh lokasi (tanpa
  // locationID); pengguna lain memuat stok lokasi aktif, yaitu outlet tenant.
  await page.goto(URL_OUTLET, { waitUntil: "commit" });
  const pLokasi = tunggu<LokasiMentah[]>(page, getLokasi);
  const pInventory = tunggu<InventoryMentah[]>(
    page,
    getInventory((u) => u.searchParams.has("locationID") !== ADA_IZIN_LINTAS),
  );
  const [lokasi, inventory] = await Promise.all([pLokasi, pInventory]);
  await expect(page.getByRole("columnheader", { name: "Nama Barang" })).toBeVisible();
  return { lokasi, inventory: diOutlet(inventory) };
}

async function bukaGudang(page: Page) {
  await page.goto(URL_GUDANG, { waitUntil: "commit" });
  const pInventory = tunggu<InventoryMentah[]>(
    page,
    getInventory((u) => u.searchParams.has("locationID")),
  );
  const inventory = await pInventory;
  await expect(page.getByRole("columnheader", { name: "Nama Barang" })).toBeVisible();
  return inventory;
}

// ============================================================
// HELPER: Dialog stok minimum dan opname
// ============================================================
async function ubahStokMinimum(page: Page, target: Locator, nilai: number) {
  await target.getByRole("cell").nth(3).getByRole("button").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator("input").first().fill(String(nilai));

  const tPatch = page.waitForResponse(
    (r) =>
      r.request().method() === "PATCH" && /\/api\/inventory\/[^/]+\/minimum-stok/.test(r.url()),
  );
  await dialog.getByRole("button", { name: "Simpan Perubahan" }).click();
  const res = await tPatch;
  expect(res.status()).toBe(200);
  expect(res.request().postDataJSON()).toEqual({ stokMinimum: nilai });

  await expect(dialog).toBeHidden();
  await expect(target.getByRole("cell").nth(3)).toContainText(polaAngka(nilai));
}

async function opnameTanpaSelisih(
  page: Page,
  target: Locator,
  stok: number,
  placeholderFisik: string,
  placeholderCatatan: string,
) {
  await target.getByRole("cell").nth(4).getByRole("button").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder(placeholderFisik).fill(String(stok));

  // Catatan wajib: tombol eksekusi nonaktif sampai catatan diisi.
  const tombol = dialog.getByRole("button", { name: "Eksekusi Koreksi" });
  await expect(tombol).toBeDisabled();
  await dialog.getByPlaceholder(placeholderCatatan).fill(CATATAN_OPNAME);
  await expect(tombol).toBeEnabled();

  const tPost = page.waitForResponse(
    (r) => r.request().method() === "POST" && /\/api\/inventory\/[^/]+\/opname/.test(r.url()),
  );
  await tombol.click();
  const res = await tPost;
  expect(res.status()).toBe(200);
  const body = res.request().postDataJSON() as { fisikAktual: number; catatan?: string };
  expect(body.fisikAktual).toBe(stok);
  expect(body.catatan).toBe(CATATAN_OPNAME);

  await expect(dialog).toBeHidden();
  await expect(target.getByRole("cell").nth(2)).toContainText(polaAngka(stok));
}

// ============================================================
// SKENARIO
// ============================================================
test.describe("Stok outlet", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("lintas outlet: semua lokasi hanya stok di lokasi bertipe outlet", async ({ page }) => {
    test.fixme(!ADA_IZIN_LINTAS, MENUNGGU_IZIN_LINTAS);
    const { inventory } = await bukaOutlet(page);
    await periksaBaris(page, inventory.length, KOSONG_OUTLET);
  });

  test("tanpa izin lintas outlet: stok outlet tenant tanpa pemilih lokasi", async ({ page }) => {
    test.skip(ADA_IZIN_LINTAS, JALUR_TERKUNCI);
    await page.goto(URL_OUTLET, { waitUntil: "commit" });
    const pAktif = tunggu<LokasiMentah | null>(page, getLokasiAktif);
    const tInventory = page.waitForRequest(
      (r) => r.method() === "GET" && /\/api\/inventory(\?|$)/.test(r.url()),
    );
    const aktif = await pAktif;
    const idAktif = aktif?.id ?? aktif?._id;
    expect(idAktif, "outlet tenant dari /location/current").toBeTruthy();
    expect(new URL((await tInventory).url()).searchParams.get("locationID")).toBe(idAktif);
    await expect(page.getByRole("columnheader", { name: "Nama Barang" })).toBeVisible();
    await expect(page.getByText("Semua Lokasi", { exact: true })).toHaveCount(0);
  });

  test("tab stok kritis menyaring stok di bawah batas minimum", async ({ page }) => {
    const { inventory } = await bukaOutlet(page);
    await page.getByText("Stok Kritis").first().click();
    await periksaBaris(page, inventory.filter((i) => i.isStokKritis).length, KOSONG_OUTLET);
  });

  test("pencarian mengirim kata kunci ke server dan menampilkan hasilnya", async ({ page }) => {
    const { inventory } = await bukaOutlet(page);
    const nama = inventory.find((i) => i.item?.nama)?.item?.nama;
    test.skip(!nama, "Belum ada stok outlet bernama barang");

    const pCari = tunggu<InventoryMentah[]>(
      page,
      getInventory((u) => u.searchParams.get("search") === nama),
    );
    await page.getByPlaceholder("Cari nama barang...").fill(nama!);
    const hasil = diOutlet(await pCari);

    await periksaBaris(page, hasil.length, KOSONG_OUTLET);
  });

  test("lintas outlet: pilih lokasi mengirim locationID dan menampilkan stok lokasi itu", async ({ page }) => {
    test.fixme(!ADA_IZIN_LINTAS, MENUNGGU_IZIN_LINTAS);
    const { lokasi } = await bukaOutlet(page);
    const outlet = lokasi.find((l) => l.tipe === "Outlet");
    test.skip(!outlet, "Belum ada lokasi bertipe outlet");
    const idOutlet = outlet!.id ?? outlet!._id;

    const pLokasi = tunggu<InventoryMentah[]>(
      page,
      getInventory((u) => u.searchParams.get("locationID") === idOutlet),
    );
    await page.getByText("Semua Lokasi", { exact: true }).click();
    await page.getByRole("option", { name: outlet!.nama }).click();
    const hasil = diOutlet(await pLokasi);

    await periksaBaris(page, hasil.length, KOSONG_OUTLET);
  });

  test("ubah batas minimum lalu kembalikan ke nilai semula", async ({ page }) => {
    const { inventory } = await bukaOutlet(page);
    const inv = inventory.find((i) => i.item?.nama && i.lokasi?.nama);
    test.skip(!inv, "Belum ada stok outlet yang bisa diuji");

    const target = baris(page)
      .filter({ hasText: inv!.item!.nama! })
      .filter({ hasText: inv!.lokasi!.nama! })
      .first();
    await ubahStokMinimum(page, target, inv!.stokMinimum + 1);
    await ubahStokMinimum(page, target, inv!.stokMinimum);
  });

  test("opname tanpa selisih mengirim fisik aktual dan menutup dialog", async ({ page }) => {
    const { inventory } = await bukaOutlet(page);
    const inv = inventory.find((i) => i.item?.nama && i.lokasi?.nama);
    test.skip(!inv, "Belum ada stok outlet yang bisa diuji");

    const target = baris(page)
      .filter({ hasText: inv!.item!.nama! })
      .filter({ hasText: inv!.lokasi!.nama! })
      .first();
    await opnameTanpaSelisih(
      page,
      target,
      inv!.stok,
      "Masukkan hitungan fisik riil...",
      "Contoh: Barang tumpah, kemasan rusak...",
    );
  });
});

test.describe("Inventaris gudang", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("menampilkan stok gudang yang dikirim server", async ({ page }) => {
    const inventory = await bukaGudang(page);
    test.skip(inventory.length === 0, "Belum ada stok di gudang");
    await periksaBaris(page, inventory.length);
  });

  test("tab stok kritis menyaring stok di bawah batas minimum", async ({ page }) => {
    const inventory = await bukaGudang(page);
    const kritis = inventory.filter((i) => i.isStokKritis).length;
    test.skip(kritis === 0, "Tidak ada stok gudang yang kritis");

    await page.getByText("Stok Kritis").first().click();
    await periksaBaris(page, kritis);
  });

  test("pencarian mengirim kata kunci ke server dan menampilkan hasilnya", async ({ page }) => {
    const inventory = await bukaGudang(page);
    const nama = inventory.find((i) => i.item?.nama)?.item?.nama;
    test.skip(!nama, "Belum ada stok gudang bernama barang");

    const pCari = tunggu<InventoryMentah[]>(
      page,
      getInventory((u) => u.searchParams.get("search") === nama),
    );
    await page.getByPlaceholder("Cari barang di gudang...").fill(nama!);
    const hasil = await pCari;

    test.skip(hasil.length === 0, "Pencarian gudang tidak mengembalikan data");
    await periksaBaris(page, hasil.length);
  });

  test("ubah batas minimum lalu kembalikan ke nilai semula", async ({ page }) => {
    const inventory = await bukaGudang(page);
    const inv = inventory.find((i) => i.item?.nama);
    test.skip(!inv, "Belum ada stok gudang yang bisa diuji");

    const target = baris(page).filter({ hasText: inv!.item!.nama! }).first();
    await ubahStokMinimum(page, target, inv!.stokMinimum + 1);
    await ubahStokMinimum(page, target, inv!.stokMinimum);
  });

  test("opname tanpa selisih mengirim fisik aktual dan menutup dialog", async ({ page }) => {
    const inventory = await bukaGudang(page);
    const inv = inventory.find((i) => i.item?.nama);
    test.skip(!inv, "Belum ada stok gudang yang bisa diuji");

    const target = baris(page).filter({ hasText: inv!.item!.nama! }).first();
    await opnameTanpaSelisih(
      page,
      target,
      inv!.stok,
      "Masukkan hitungan riil...",
      "Contoh: Barang tumpah...",
    );
  });

  test("dialog tambah barang terbuka dan tertutup tanpa menyimpan", async ({ page }) => {
    await bukaGudang(page);
    let adaPost = false;
    page.on("request", (r) => {
      if (r.method() === "POST" && /\/api\/inventory(\?|$)/.test(r.url())) adaPost = true;
    });

    await page.getByRole("button", { name: /masukkan master data/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Tarik Master Data ke Gudang")).toBeVisible();
    await dialog.getByRole("button", { name: "Batal" }).click();

    await expect(dialog).toBeHidden();
    expect(adaPost).toBe(false);
  });

  test("gagal tambah barang: pesan gagal tampil dan dialog tetap terbuka", async ({ page }) => {
    await bukaGudang(page);
    await page.getByRole("button", { name: /masukkan master data/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Tarik Master Data ke Gudang")).toBeVisible();

    await dialog.getByText("Pilih bahan baku...").click();
    const opsi = page.getByRole("option");
    await expect(
      opsi.first().or(page.getByText("Semua master data sudah ada di gudang.")),
    ).toBeVisible();
    test.skip((await opsi.count()) === 0, "Semua master data sudah ada di gudang");
    await opsi.first().click();
    await dialog.getByPlaceholder("0").nth(0).fill("1");
    await dialog.getByPlaceholder("0").nth(1).fill("0");

    const pola = "**/api/inventory";
    await page.route(pola, (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ status: "error", message: "uji gagal tambah" }),
          })
        : route.continue(),
    );
    await dialog.getByRole("button", { name: "Simpan ke Gudang" }).click();

    await expect(page.getByText("Gagal Menambahkan Barang")).toBeVisible();
    await expect(dialog).toBeVisible();
    await page.unroute(pola);
  });
});