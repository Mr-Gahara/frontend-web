import { expect, test, type Locator, type Page } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Isian tanggal filter tidak meluber (pemilik proyek, 12 November 2026):
 * di HP "Dari" dan "Sampai" masing-masing selebar layar dan bertumpuk seperti
 * Arus Kas, dan sejak sm tombolnya 208 px (sm:w-52) agar bulan terpanjang
 * muat dengan padding utuh. Jam browser dipatok 30 September 2026, sehingga
 * filter bawaan berisi tanggal September sampai "30 September 2026", nama
 * bulan terpanjang.
 */

const JAM_PATOKAN = new Date("2026-09-30T10:00:00+07:00");

const HALAMAN: readonly { url: string; dari: string; sampai: string }[] = [
  { url: "/dashboard/outlet/keuangan/belanjaStok", dari: "Pembelian dari", sampai: "Pembelian sampai" },
  { url: "/dashboard/outlet/inventaris/pembelianStok", dari: "Pembelian dari", sampai: "Pembelian sampai" },
  { url: "/dashboard/gudang/pembelianStok", dari: "Pembelian dari", sampai: "Pembelian sampai" },
  { url: "/dashboard/outlet/keuangan/mesinKasir", dari: "Dibuka dari", sampai: "Dibuka sampai" },
  { url: "/dashboard/outlet/inventaris/jurnalStok", dari: "Dari tanggal", sampai: "Sampai tanggal" },
  { url: "/dashboard/gudang/jurnalStok", dari: "Dari tanggal", sampai: "Sampai tanggal" },
];

const tombolTanggal = (page: Page, label: string) =>
  page.getByRole("button", { name: new RegExp(`^${label}, \\d{2} \\w+ \\d{4}$`) });

async function kotak(loc: Locator) {
  const k = await loc.boundingBox();
  expect(k, "tombol tanggal punya ukuran di layar").not.toBeNull();
  return k!;
}

async function tidakLuber(loc: Locator, nama: string, lebarLayar: number) {
  const ukuran = await loc.evaluate((el) => ({ isi: el.scrollWidth, kotak: el.clientWidth }));
  expect(ukuran.isi, `${nama}: teks ${ukuran.isi}px muat di tombol ${ukuran.kotak}px`).toBeLessThanOrEqual(ukuran.kotak);
  const k = await kotak(loc);
  expect(k.x + k.width, `${nama}: tidak keluar layar`).toBeLessThanOrEqual(lebarLayar);
}

for (const [nama, ukuran] of [
  ["HP", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 900 }],
] as const) {
  test(`tanggal filter ${nama}: September muat di tombolnya di keenam laman`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(ukuran);
    await login(page);
    await page.clock.setFixedTime(JAM_PATOKAN);

    for (const h of HALAMAN) {
      await page.goto(h.url);
      const dari = tombolTanggal(page, h.dari);
      const sampai = tombolTanggal(page, h.sampai);
      await expect(dari, `${h.url}: isian ${h.dari}`).toBeVisible({ timeout: 20_000 });
      // Bawaan bulan berjalan dimulai tanggal 1; riwayat Mesin Kasir tujuh hari
      // terakhir (24 September). Keduanya sepanjang "30 September 2026".
      await expect(dari).toHaveAccessibleName(new RegExp(`^${h.dari}, \\d{2} September 2026$`));
      await expect(sampai).toHaveAccessibleName(`${h.sampai}, 30 September 2026`);

      await tidakLuber(dari, `${h.url} ${h.dari}`, ukuran.width);
      await tidakLuber(sampai, `${h.url} ${h.sampai}`, ukuran.width);

      const kDari = await kotak(dari);
      const kSampai = await kotak(sampai);
      // Desktop cukup tidak meluber: di ruang gudang lima filter memang
      // turun ke baris kedua sejak sebelum tombol dilebarkan.
      if (nama === "HP") {
        const wadah = dari.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' grid ')][1]");
        const kWadah = await kotak(wadah);
        expect(kSampai.y, `${h.url}: Sampai di bawah Dari`).toBeGreaterThanOrEqual(kDari.y + kDari.height);
        for (const [n, k] of [
          ["Dari", kDari],
          ["Sampai", kSampai],
        ] as const) {
          expect(Math.abs(k.width - kWadah.width), `${h.url}: ${n} ${k.width}px selebar filter ${kWadah.width}px`).toBeLessThan(2);
        }
      }
    }
  });
}
