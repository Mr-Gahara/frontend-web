import { test, expect, type Page } from "@playwright/test";
import { masuk } from "../../helpers/masuk-uji";
import { balonPanduan as balon, jalaniTur } from "../../helpers/panduan-uji";
import { IZIN } from "../../../lib/auth/permissions";
import { masukSebagai } from "../../helpers/terkunci-uji";
import { ALASAN_TANPA_ADMIN, hapusAkunKlienUji, kredensialAdmin, wajibAdmin } from "../../helpers/admin-uji";
import { akunBaru, isiTokoDanOwner } from "../../helpers/setup-uji";

/*
 * Tur dashboard ruang outlet (keputusan pemilik proyek, 7 November 2026)
 * dan ruang gudang (TG1a dan TG2a, 17 November 2026).
 * playwright.config.ts mematikan tur otomatis lewat storageState; spec ini
 * mengosongkannya. Akun uji masuk sebagai Owner, sehingga kelima titik
 * tampil; penyaringan titik menurut izin juga diuji lewat pengguna uji tanpa
 * read-pengguna, dan aturannya di unit test
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

const TARGET_GUDANG = [
  "menu-utama",
  "menu:/dashboard/gudang/inventaris",
  "menu:/dashboard/gudang/pengajuanStok",
  "menu:/dashboard/gudang/transferStok",
  "menu:/dashboard/gudang/pengguna",
  "menu:/dashboard/gudang/pengaturan",
];

const tombolPanduan = (page: Page) => page.getByRole("button", { name: "Lihat panduan dashboard" });

async function masukKeOutlet(page: Page) {
  await masuk(page);
  await page.waitForURL("**/dashboard/outlet", { timeout: 15_000 });
}

test.describe("Panduan dashboard", () => {
  test("tur tampil sendiri sekali di ruang outlet, dibuka ulang dari topbar, lalu ruang gudang punya turnya sendiri", async ({
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

    await test.step("ruang gudang: tur sendiri tampil sekali dan menyorot keenam titik gudang", async () => {
      await page.goto("/dashboard/gudang");
      await expect(balon(page)).toContainText("Panduan 1 dari 6", { timeout: 15_000 });
      await jalaniTur(page, TARGET_GUDANG);
    });

    await test.step("ruang gudang dimuat ulang dan ruang outlet dibuka lagi: tidak ada yang tampil sendiri", async () => {
      await page.reload();
      await expect(tombolPanduan(page)).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(1_500);
      await expect(balon(page)).toHaveCount(0);
      await tombolPanduan(page).click();
      await expect(balon(page)).toContainText("Panduan 1 dari 6");
      await page.keyboard.press("Escape");
      await page.goto("/dashboard/outlet");
      await expect(tombolPanduan(page)).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(1_500);
      await expect(balon(page)).toHaveCount(0);
    });
  });

  test("Setup Gudang tanpa tombol panduan dan tanpa tur, sehingga tur gudang menunggu sampai Gudang terdaftar (TG2a)", async ({
    page,
  }) => {
    await masukKeOutlet(page);
    const polaLokasi = /\/api\/location(\?|$)/i;
    await page.route(polaLokasi, async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const asli = await route.fetch();
      const body = await asli.json();
      body.data = (body.data ?? []).filter((l: { tipe?: string }) => l.tipe !== "Gudang");
      // simulasi: akun uji sudah punya Gudang, sehingga keadaan belum ada Gudang dibuat dengan menyaring lokasi Gudang dari respons nyata, tanpa menulis data
      await route.fulfill({ response: asli, json: body });
    });
    try {
      await page.goto("/dashboard/gudang");
      await page.waitForURL("**/dashboard/gudang/setup", { timeout: 15_000 });
      await expect(page.getByRole("button", { name: /^Pemberitahuan/ })).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(1_500);
      await expect(tombolPanduan(page)).toHaveCount(0);
      await expect(balon(page)).toHaveCount(0);
    } finally {
      await page.unroute(polaLokasi);
    }
    await page.goto("/dashboard/gudang");
    await expect(balon(page)).toContainText("Panduan 1 dari 6", { timeout: 15_000 });
  });

  test("pengguna tanpa read-pengguna: tur hanya menyorot menu yang tampil baginya, di ruang outlet dan gudang", async ({
    page,
  }) => {
    await masuk(page);
    await masukSebagai(page, {
      nama: "E2E Tur Tanpa Pengguna",
      pin: "864237",
      deskripsi: "Peran uji e2e: izin baca Owner tanpa read-pengguna, untuk titik tur menurut izin",
      izin: (n) => n.startsWith("read-") && n !== IZIN.pengguna,
    });
    await page.waitForURL("**/dashboard/outlet", { timeout: 15_000 });
    // Karyawan dan Jadwal menuntut read-pengguna (IZIN_HALAMAN), sehingga
    // menunya tidak tampil dan titiknya tidak ada.
    await expect(page.locator('[data-panduan="menu:/dashboard/outlet/pengaturan"]')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-panduan="menu:/dashboard/outlet/pengguna"]')).toHaveCount(0);
    await expect(page.locator('[data-panduan="menu:/dashboard/outlet/jadwal"]')).toHaveCount(0);
    await expect(balon(page)).toContainText("Panduan 1 dari 3", { timeout: 15_000 });
    await jalaniTur(page, ["menu-utama", "menu:/dashboard/outlet/inventaris-data", "menu:/dashboard/outlet/pengaturan"]);

    await page.goto("/dashboard/gudang");
    await expect(balon(page)).toContainText("Panduan 1 dari 5", { timeout: 15_000 });
    await jalaniTur(page, TARGET_GUDANG.filter((t) => t !== "menu:/dashboard/gudang/pengguna"));
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

test.describe("Panduan dashboard menurut plan", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("Basic: tur ruang outlet tetap lima titik; ruang gudang tanpa tur dan tanpa tombol panduan", async ({ page }) => {
    // Tur wizard dimatikan selama setup lewat saklar uji, lalu saklarnya
    // dikosongkan agar tur dashboard tampil sendiri.
    await page.goto("/login");
    await page.evaluate(() => localStorage.setItem("tachyon.panduan.otomatis", "mati"));
    const { id } = await akunBaru(page, "panduan-basic");
    try {
      await isiTokoDanOwner(page);
      await page.goto("/dashboard/outlet");
      await expect(tombolPanduan(page)).toBeVisible({ timeout: 15_000 });
      await page.evaluate(() => localStorage.removeItem("tachyon.panduan.otomatis"));
      await page.reload();
      // Titik ruang outlet tidak bergantung plan (titik-dashboard.test.ts).
      await expect(balon(page)).toContainText("Panduan 1 dari 5", { timeout: 15_000 });
      await jalaniTur(page, TARGET);

      // Gudang di luar plan Basic: ajakan naik plan, tur gudang tidak tampil
      // sendiri, dan tombol panduan tidak dipasang (pemilik proyek, 24 November 2026).
      await page.goto("/dashboard/gudang");
      await expect(page.getByText("Gudang belum termasuk plan Anda")).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(1_500);
      await expect(balon(page)).toHaveCount(0);
      await expect(tombolPanduan(page)).toHaveCount(0);
      expect(
        await page.evaluate(() =>
          Object.keys(localStorage).filter((k) => k.startsWith("tachyon.panduan.v1.dashboard-gudang")),
        ),
        "tur gudang tidak dicatat dilihat",
      ).toEqual([]);
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });
});
