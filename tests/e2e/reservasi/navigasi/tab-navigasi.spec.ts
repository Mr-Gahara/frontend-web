import { expect, test, type Page } from "@playwright/test";
import { login } from "../../../helpers/transfer-uji";

/*
 * Tab navigasi Reservasi (pemilik proyek, 14 November 2026;
 * modul/ui-ux.md CV18a): di Buat Reservasi tab Dasbor Timeline menyala, dan
 * tab mendapat cincin navy di dalam tab saat difokuskan dengan keyboard.
 */

const AKTIF = /border-navy(\s|$)/;

async function fokusLewatTab(page: Page, nama: string) {
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const teks = await page.evaluate(() => (document.activeElement?.textContent ?? "").trim());
    if (teks === nama) return;
  }
  throw new Error(`tab "${nama}" tidak tercapai lewat keyboard`);
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("Buat Reservasi: tab Dasbor Timeline menyala", async ({ page }) => {
  await page.goto("/dashboard/outlet/reservasi/buatReservasi");
  const nav = page.getByRole("navigation", { name: "Navigasi Reservasi" });
  await expect(nav.getByRole("link", { name: "Dasbor Timeline" })).toHaveClass(AKTIF);
  await expect(nav.getByRole("link", { name: "Aset (Meja/Unit)" })).not.toHaveClass(AKTIF);
});

// Tab Inventaris (inventaris-nav-tabs.tsx) tidak dipasang di halaman mana pun,
// sehingga hanya tab Reservasi yang dapat diuji.
test("Reservasi: tab yang difokuskan keyboard bercincin di dalam tab", async ({ page }) => {
  await page.goto("/dashboard/outlet/reservasi");
  const link = page
    .getByRole("navigation", { name: "Navigasi Reservasi" })
    .getByRole("link", { name: "Aset (Meja/Unit)", exact: true });
  const tab = "Aset (Meja/Unit)";
  await expect(link).toBeVisible({ timeout: 15_000 });
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await fokusLewatTab(page, tab);
  // box-shadow Tailwind selalu berisi lapisan transparan, dan tab memakai
  // transition-all: tunggu sampai cincin 2 px inset benar-benar terpasang.
  await expect
    .poll(() => link.evaluate((e) => getComputedStyle(e).boxShadow), { message: "cincin fokus keyboard" })
    .toMatch(/\/ 0\.5\) 0px 0px 0px 2px inset|0\.5\) 0px 0px 0px 2px inset/);
});
