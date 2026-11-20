import { expect, test, type Locator, type Page } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";
import { bukaPanelFilter } from "../../helpers/filter-uji";

/*
 * Isian tanggal filter tidak meluber (pemilik proyek, 12 November 2026,
 * BS6a). Sejak filter seragam (FL1a, 19 November 2026) isian periode berada
 * di panel samping "Filter lainnya", sebagai dua kolom sebaris di HP maupun
 * desktop (PilihanPeriode di components/filter/panel-filter.tsx); spec ini
 * tertinggal dan disesuaikan 20 November 2026. Bulan panjang meluber dari
 * tombol setengah lebar panel, sehingga tanggalnya berbulan singkat
 * ("30 Sep 2026", FL20a). Jam browser dipatok 30 September 2026, bulan
 * terpanjang, sehingga filter bawaan berisi tanggal September.
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
      await expect(page.getByRole("button", { name: /^Filter lainnya/ }), `${h.url}: tombol filter`).toBeVisible({
        timeout: 20_000,
      });
      const panel = await bukaPanelFilter(page);
      // Panel bergeser masuk (panel-filter-gerak); ukur setelah animasinya selesai.
      await panel.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
      const dari = tombolTanggal(page, h.dari);
      const sampai = tombolTanggal(page, h.sampai);
      await expect(dari, `${h.url}: isian ${h.dari}`).toBeVisible();
      // Bawaan bulan berjalan dimulai tanggal 1; riwayat Mesin Kasir tujuh hari
      // terakhir (24 September). Keduanya sepanjang "30 September 2026".
      await expect(dari).toHaveAccessibleName(new RegExp(`^${h.dari}, \\d{2} Sep 2026$`));
      await expect(sampai).toHaveAccessibleName(`${h.sampai}, 30 Sep 2026`);

      await tidakLuber(dari, `${h.url} ${h.dari}`, ukuran.width);
      await tidakLuber(sampai, `${h.url} ${h.sampai}`, ukuran.width);

      // Dua kolom sebaris di dalam panel: keduanya di dalam lebar panel.
      const kDari = await kotak(dari);
      const kSampai = await kotak(sampai);
      const kPanel = await kotak(panel);
      expect(Math.abs(kSampai.y - kDari.y), `${h.url}: Dari dan Sampai sebaris`).toBeLessThan(2);
      for (const [n, k] of [
        ["Dari", kDari],
        ["Sampai", kSampai],
      ] as const) {
        expect(k.x, `${h.url}: ${n} di dalam panel`).toBeGreaterThanOrEqual(kPanel.x);
        expect(k.x + k.width, `${h.url}: ${n} di dalam panel`).toBeLessThanOrEqual(kPanel.x + kPanel.width + 1);
      }
      await page.keyboard.press("Escape");
      await expect(panel).toBeHidden();
    }
  });
}
