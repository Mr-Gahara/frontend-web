import { expect, test } from "@playwright/test";
import { bukaDenganAuth, login } from "../../helpers/transfer-uji";

/** Ada lapisan bayangan yang terlihat: alfa warnanya di atas 0, baik rgba(...) maupun color(srgb ... / a). */
function adaBayanganTerlihat(boxShadow: string): boolean {
  const warna = boxShadow.match(/rgba?\([^)]*\)|color\([^)]*\)/g) ?? [];
  return warna.some((w) => {
    const alfa = w.startsWith("color(") ? w.match(/\/\s*([\d.]+)\s*\)$/)?.[1] : w.match(/,\s*([\d.]+)\s*\)$/)?.[1];
    return alfa === undefined ? true : Number(alfa) > 0;
  });
}

/*
 * Bayangan kartu baris tabel (pemilik proyek, 23 November 2026): dipasang
 * per sel lewat box-shadow, bukan filter pada tr, agar tampil di semua
 * browser; di mode kartu DataTable bayangan ada di kartunya (baris), dan
 * sel tanpa bayangan agar field kartu tidak bergaris.
 */

const URL_DAFTAR = "/dashboard/outlet/penjualan";

test.describe("bayangan kartu baris", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("lebar meja: setiap sel berbayangan bawah, baris tanpa filter", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await bukaDenganAuth(page, URL_DAFTAR);
    const baris = page.locator("tbody tr").first();
    await expect(baris.locator("td").first()).toBeVisible({ timeout: 15_000 });
    const gaya = await baris.evaluate((tr) => ({
      filter: getComputedStyle(tr).filter,
      sel: [...tr.querySelectorAll("td")].map((td) => getComputedStyle(td).boxShadow),
    }));
    expect(gaya.filter).toBe("none");
    expect(gaya.sel.length).toBeGreaterThan(1);
    for (const b of gaya.sel) {
      expect(b, "box-shadow bawah 1 px").toMatch(/0px 1px 0px/);
      expect(adaBayanganTerlihat(b), `bayangan sel terlihat: ${b}`).toBe(true);
    }
  });

  test("HP 390 px (mode kartu): kartu berbayangan, sel di dalamnya tidak", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await bukaDenganAuth(page, URL_DAFTAR);
    const kartu = page.locator("tbody tr").first();
    await expect(kartu.locator("td").first()).toBeVisible({ timeout: 15_000 });
    const gaya = await kartu.evaluate((tr) => ({
      tampil: getComputedStyle(tr).display,
      kartu: getComputedStyle(tr).boxShadow,
      sel: [...tr.querySelectorAll("td")].map((td) => getComputedStyle(td).boxShadow),
    }));
    expect(gaya.tampil).toBe("flex");
    // Tailwind v4 menulis shadow-none sebagai lapisan bayangan transparan,
    // sehingga yang diperiksa adalah warnanya: kartu punya lapisan berwarna,
    // dan setiap lapisan sel transparan (tidak terlihat).
    expect(adaBayanganTerlihat(gaya.kartu), `bayangan kartu terlihat: ${gaya.kartu}`).toBe(true);
    for (const b of gaya.sel) expect(b === "none" || !adaBayanganTerlihat(b), `sel tanpa bayangan terlihat: ${b}`).toBe(true);
  });
});
