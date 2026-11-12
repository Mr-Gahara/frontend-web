import { test, expect, type Page } from "@playwright/test";
import { masuk } from "../../helpers/masuk-uji";
import { balonPanduan as balon, jalaniTur } from "../../helpers/panduan-uji";

/*
 * Tur dashboard ruang outlet (keputusan pemilik proyek, 7 November 2026).
 * playwright.config.ts mematikan tur otomatis lewat storageState; spec ini
 * mengosongkannya. Akun uji masuk sebagai Owner, sehingga kelima titik
 * tampil; penyaringan titik menurut izin diuji di unit test
 * (tests/unit/components/panduan/titik-dashboard.test.ts).
 */
test.use({ storageState: { cookies: [], origins: [] } });
test.describe.configure({ timeout: 120_000 });

const TARGET = [
  "menu-utama",
  "menu:/dashboard/outlet/inventaris-data",
  "menu:/dashboard/outlet/pengguna",
  "menu:/dashboard/outlet/jadwal",
  "menu:/dashboard/outlet/pengaturan",
];

const tombolPanduan = (page: Page) => page.getByRole("button", { name: "Lihat panduan dashboard" });

async function masukKeOutlet(page: Page) {
  await masuk(page);
  await page.waitForURL("**/dashboard/outlet", { timeout: 15_000 });
}

test.describe("Panduan dashboard", () => {
  test("tur tampil sendiri sekali di ruang outlet, dibuka ulang dari topbar, dan tidak ada di ruang gudang", async ({
    page,
  }) => {
    await masukKeOutlet(page);

    await test.step("tampil sendiri dan menyorot kelima titik", async () => {
      await expect(balon(page)).toContainText("Panduan 1 dari 5", { timeout: 15_000 });
      await expect(balon(page)).toContainText("menyempitkan atau melebarkan menu");
      await jalaniTur(page, TARGET);
    });

    await test.step("dimuat ulang: tidak tampil sendiri lagi; tombol topbar membukanya, Escape menutup", async () => {
      await page.reload();
      await expect(tombolPanduan(page)).toBeVisible({ timeout: 15_000 });
      // Tur otomatis dibuka 400 ms setelah sesi pulih; ditunggu lebih lama
      // agar ketiadaannya benar-benar teruji.
      await page.waitForTimeout(1_500);
      await expect(balon(page)).toHaveCount(0);
      await tombolPanduan(page).click();
      await expect(balon(page)).toContainText("Panduan 1 dari 5");
      await page.keyboard.press("Escape");
      await expect(balon(page)).toHaveCount(0);
    });

    await test.step("ruang gudang tidak punya tombol panduan dashboard", async () => {
      await page.goto("/dashboard/gudang");
      // Lonceng menandai topbar sudah termuat (aktif sejak desain C, 12 November 2026).
      await expect(page.getByRole("button", { name: /^Pemberitahuan/ })).toBeVisible({ timeout: 15_000 });
      await expect(tombolPanduan(page)).toHaveCount(0);
      await expect(balon(page)).toHaveCount(0);
    });
  });

  test.describe("di HP", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("sidebar dibuka untuk titik menu, tetap terbuka selama tur, dan ditutup saat tur selesai", async ({ page }) => {
      await masukKeOutlet(page);
      const sidebar = page.locator('[data-sidebar="sidebar"][data-mobile="true"]');
      await expect(balon(page)).toContainText("Panduan 1 dari 5", { timeout: 15_000 });
      await expect(balon(page)).toContainText("panduan membukanya untuk Anda");
      await jalaniTur(page, TARGET, async (i) => {
        if (i === 0) await expect(sidebar, "titik menu utama: sidebar masih tertutup").toBeHidden();
        else await expect(sidebar, `titik ${i + 1}: sidebar terbuka`).toBeVisible();
      });
      await expect(sidebar, "tur selesai: sidebar ditutup lagi").toBeHidden();
    });
  });
});