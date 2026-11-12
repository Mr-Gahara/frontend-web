import { test, expect } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Halaman galat desain A (pemilik proyek, 12 November 2026). 404 rute yang
 * tidak ada tampil sebagai halaman penuh, di luar dan di dalam /dashboard,
 * di lebar desktop dan HP. 403 tertanam diuji spec gerbang rute; 500 diuji
 * unit test, karena galat runtime tidak dapat dibuat deterministik tanpa
 * memalsukan respons.
 */

for (const { nama, lebar } of [
  { nama: "desktop", lebar: 1280 },
  { nama: "HP", lebar: 390 },
]) {
  test(`404 ${nama}: rute yang tidak ada menampilkan halaman galat penuh dan Ke dashboard membuka dashboard`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: lebar, height: 844 });
    await login(page);
    const res = await page.goto("/dashboard/halaman-yang-tidak-ada");
    expect(res?.status(), "status HTTP 404").toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" })).toBeVisible();
    await expect(page.getByText("Kode galat", { exact: true })).toBeVisible();
    await expect(page.getByText("404", { exact: true })).toBeVisible();
    const lebarHalaman = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(lebarHalaman, "tanpa gulir mendatar").toBeLessThanOrEqual(lebar);

    await page.getByRole("link", { name: "Ke dashboard" }).click();
    await page.waitForURL(/\/dashboard\/(outlet|gudang)/);
  });
}

test("404 di luar dashboard dan tautan kembali ke halaman sebelumnya", async ({ page }) => {
  await page.goto("/login");
  await page.goto("/tidak-ada-sama-sekali");
  await expect(page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" })).toBeVisible();
  await page.getByRole("button", { name: "Kembali ke halaman sebelumnya" }).click();
  await page.waitForURL(/\/login$/);
});
