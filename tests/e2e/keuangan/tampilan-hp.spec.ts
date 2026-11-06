import { expect, test, type Locator, type Page } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Tampilan tab Keuangan di lebar HP (perbaikan HP Keuangan, pratinjau Revisi 1
 * disetujui pemilik proyek 6 November 2026): bar tab turun ke baris berikutnya
 * sehingga tab aktif selalu terlihat, kartu ringkasan dua kolom berjudul
 * pendek, tombol header Akun Kas bertumpuk penuh tanpa label terpotong, dan
 * halaman tidak menggulir ke samping. Skenario desktop memastikan tampilan
 * sejak sm tidak ikut berubah.
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

test.describe("tampilan tab Keuangan", () => {
  test("di lebar HP bar tab, kartu ringkasan, dan tombol Akun Kas tampil utuh tanpa gulir ke samping", async ({
    page,
  }) => {
    await bukaAkunKas(page, HP);

    await test.step("setiap tab berada di dalam layar, labelnya utuh, dan tab aktif ditandai", async () => {
      const nav = page.getByRole("navigation", { name: "Navigasi Keuangan" });
      const tab = nav.getByRole("link");
      const jumlah = await tab.count();
      expect(jumlah, "tab Keuangan lebih dari satu").toBeGreaterThan(1);
      for (let i = 0; i < jumlah; i++) {
        await expect(tab.nth(i)).toBeVisible();
        const k = await kotak(tab.nth(i));
        expect(k.x, `tab ${i + 1} tidak keluar ke kiri`).toBeGreaterThanOrEqual(0);
        expect(k.x + k.width, `tab ${i + 1} tidak keluar ke kanan`).toBeLessThanOrEqual(HP.width);
        expect(await tidakTerpotong(tab.nth(i)), `label tab ${i + 1} utuh`).toBe(true);
      }
      await expect(nav.getByRole("link", { name: "Akun Kas & Bank" })).toHaveAttribute(
        "aria-current",
        "page",
      );
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

  test("di lebar HP isi tab Akun Kas dan Ringkasan Laba/Rugi selebar bar tab tanpa padding tambahan", async ({
    page,
  }) => {
    await page.setViewportSize(HP);
    await login(page);
    for (const url of [URL_AKUN, URL_LABA_RUGI]) {
      await page.goto(url);
      const nav = page.getByRole("navigation", { name: "Navigasi Keuangan" });
      await expect(nav).toBeVisible({ timeout: 20_000 });
      // Elemen pertama di dalam halaman: saudara bar tab di layout Keuangan.
      const isi = nav.locator("xpath=../following-sibling::div[1]/div[1]/*[1]");
      await expect(isi).toBeVisible({ timeout: 20_000 });
      const kNav = await kotak(nav);
      const kIsi = await kotak(isi);
      expect(Math.abs(kIsi.x - kNav.x), `${url}: isi rata kiri dengan bar tab`).toBeLessThan(2);
      expect(Math.abs(kIsi.width - kNav.width), `${url}: isi ${kIsi.width}px selebar bar tab ${kNav.width}px`).toBeLessThan(2);
    }
  });

  test("di lebar desktop tampilan tetap: judul kartu lengkap, tab sebaris, dan tombol sebaris", async ({
    page,
  }) => {
    await bukaAkunKas(page, DESKTOP);
    await expect(page.getByText("Saldo Kas Total", { exact: true })).toBeVisible();
    await expect(page.getByText("Saldo kas total", { exact: true })).toBeHidden();

    const tab = page.getByRole("navigation", { name: "Navigasi Keuangan" }).getByRole("link");
    const pertama = await kotak(tab.first());
    const terakhir = await kotak(tab.last());
    expect(Math.abs(pertama.y - terakhir.y), "tab sebaris").toBeLessThan(2);

    const kPindah = await kotak(page.getByRole("button", { name: "Pindah Dana" }));
    const kTambah = await kotak(page.getByRole("button", { name: "Tambah Akun" }));
    expect(Math.abs(kPindah.y - kTambah.y), "kedua tombol sebaris").toBeLessThan(2);
    expect(kTambah.x, "Tambah Akun di kanan Pindah Dana").toBeGreaterThan(kPindah.x);
  });
});