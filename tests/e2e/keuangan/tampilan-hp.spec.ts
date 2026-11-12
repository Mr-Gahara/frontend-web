import { expect, test, type Locator, type Page } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Tampilan laman Keuangan di lebar HP (perbaikan HP Keuangan, pratinjau Revisi 1
 * disetujui pemilik proyek 6 November 2026): kartu ringkasan dua kolom berjudul
 * pendek, tombol header Akun Kas bertumpuk penuh tanpa label terpotong, dan
 * halaman tidak menggulir ke samping. Sejak 12 November 2026 laman Keuangan
 * dibuka dari sub-menu Keuangan dan Laporan di sidebar, dan bar tab dibuang
 * (pemilik proyek). Skenario desktop memastikan tampilan sejak sm tidak ikut
 * berubah.
 */

const URL_AKUN = "/dashboard/outlet/keuangan/akunkas";
const URL_LABA_RUGI = "/dashboard/outlet/keuangan/ringkasanLabaRugi";
const HP = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 900 };

async function kotak(loc: Locator) {
  const k = await loc.boundingBox();
  expect(k, "elemen harus punya ukuran di layar").not.toBeNull();
  return k!;
}

/** Teks di dalam elemen tidak terpotong oleh truncate atau overflow tersembunyi. */
const tidakTerpotong = (loc: Locator) => loc.evaluate((el) => el.scrollWidth <= el.clientWidth);

async function bukaAkunKas(page: Page, ukuran: { width: number; height: number }) {
  await page.setViewportSize(ukuran);
  await login(page);
  await page.goto(URL_AKUN);
  await expect(page.getByRole("heading", { name: "Daftar Akun Kas & Bank" })).toBeVisible({
    timeout: 20_000,
  });
}

test.describe("tampilan laman Keuangan", () => {
  test("di lebar HP kartu ringkasan dan tombol Akun Kas tampil utuh tanpa bar tab dan tanpa gulir ke samping", async ({
    page,
  }) => {
    await bukaAkunKas(page, HP);

    await test.step("bar tab Keuangan tidak ada lagi", async () => {
      await expect(page.getByRole("navigation", { name: "Navigasi Keuangan" })).toHaveCount(0);
    });

    await test.step("kartu ringkasan dua kolom dengan judul pendek", async () => {
      const laba = page.getByText("Laba bersih", { exact: true });
      const saldo = page.getByText("Saldo kas total", { exact: true });
      await expect(laba).toBeVisible();
      await expect(saldo).toBeVisible();
      await expect(page.getByText("Saldo Kas Total", { exact: true })).toBeHidden();
      const kLaba = await kotak(laba);
      const kSaldo = await kotak(saldo);
      expect(Math.abs(kLaba.y - kSaldo.y), "kedua kartu sebaris").toBeLessThan(2);
      expect(kSaldo.x, "kartu kedua di kanan kartu pertama").toBeGreaterThan(kLaba.x + kLaba.width);
    });

    await test.step("Tambah Akun di atas Pindah Dana, keduanya penuh, setinggi sentuhan, dan labelnya utuh", async () => {
      const tambah = page.getByRole("button", { name: "Tambah Akun" });
      const pindah = page.getByRole("button", { name: "Pindah Dana" });
      const kTambah = await kotak(tambah);
      const kPindah = await kotak(pindah);
      expect(kTambah.y + kTambah.height, "Tambah Akun di atas Pindah Dana").toBeLessThanOrEqual(kPindah.y);
      // Lebar isi halaman diukur dari judul di atasnya, bukan dari lebar layar,
      // karena kerangka dashboard punya padding sendiri.
      const kJudul = await kotak(page.getByRole("heading", { name: "Daftar Akun Kas & Bank" }));
      expect(kJudul.width, "isi halaman di HP tidak disempitkan padding berlapis").toBeGreaterThanOrEqual(320);
      for (const [nama, k] of [
        ["Tambah Akun", kTambah],
        ["Pindah Dana", kPindah],
      ] as const) {
        expect(k.height, `${nama} setinggi sentuhan`).toBeGreaterThanOrEqual(44);
        expect(Math.abs(k.width - kJudul.width), `${nama} ${k.width}px selebar isi ${kJudul.width}px`).toBeLessThan(2);
        expect(Math.abs(k.x - kJudul.x), `${nama} rata kiri dengan judul`).toBeLessThan(2);
      }
      expect(await tidakTerpotong(tambah.locator("span")), "label Tambah Akun utuh").toBe(true);
      expect(await tidakTerpotong(pindah.locator("span")), "label Pindah Dana utuh").toBe(true);
    });

    await test.step("halaman tidak menggulir ke samping", async () => {
      const lebar = await page.evaluate(() => ({
        isi: document.documentElement.scrollWidth,
        layar: window.innerWidth,
      }));
      expect(lebar.isi, "lebar isi tidak melebihi layar").toBeLessThanOrEqual(lebar.layar);
    });
  });

  test("di lebar HP isi laman Akun Kas dan Ringkasan Laba/Rugi selebar judul layout tanpa padding tambahan", async ({
    page,
  }) => {
    await page.setViewportSize(HP);
    await login(page);
    for (const url of [URL_AKUN, URL_LABA_RUGI]) {
      await page.goto(url);
      // Baris judul layout Keuangan selebar kolom layout; elemen pertama
      // halaman berada di pembungkus terakhir layout itu.
      const judul = page.getByRole("heading", { name: "Manajemen Keuangan" }).locator("..");
      await expect(judul).toBeVisible({ timeout: 20_000 });
      const isi = judul.locator("xpath=following-sibling::div[last()]/*[1]");
      await expect(isi).toBeVisible({ timeout: 20_000 });
      const kJudul = await kotak(judul);
      const kIsi = await kotak(isi);
      expect(Math.abs(kIsi.x - kJudul.x), `${url}: isi rata kiri dengan judul layout`).toBeLessThan(2);
      expect(Math.abs(kIsi.width - kJudul.width), `${url}: isi ${kIsi.width}px selebar judul ${kJudul.width}px`).toBeLessThan(2);
    }
  });

  test("di lebar desktop tampilan tetap: judul kartu lengkap, sub-menu sidebar aktif, dan tombol sebaris", async ({
    page,
  }) => {
    await bukaAkunKas(page, DESKTOP);
    await expect(page.getByText("Saldo Kas Total", { exact: true })).toBeVisible();
    await expect(page.getByText("Saldo kas total", { exact: true })).toBeHidden();

    // Laman Keuangan dibuka dari sub-menu sidebar (12 November 2026).
    await expect(page.getByRole("navigation", { name: "Navigasi Keuangan" })).toHaveCount(0);
    for (const nama of ["Penjualan", "Pengeluaran", "Akun Kas & Bank", "Mutasi Kas", "Belanja Stok", "Mesin Kasir"]) {
      await expect(page.getByRole("link", { name: nama, exact: true }), `sub-menu ${nama}`).toBeVisible();
    }
    await expect(page.getByRole("link", { name: "Akun Kas & Bank", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );

    const kPindah = await kotak(page.getByRole("button", { name: "Pindah Dana" }));
    const kTambah = await kotak(page.getByRole("button", { name: "Tambah Akun" }));
    expect(Math.abs(kPindah.y - kTambah.y), "kedua tombol sebaris").toBeLessThan(2);
    expect(kTambah.x, "Tambah Akun di kanan Pindah Dana").toBeGreaterThan(kPindah.x);
  });
});