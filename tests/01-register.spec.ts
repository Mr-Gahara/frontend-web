import { test, expect } from "@playwright/test";
import { generateSeedData } from "./helpers/seed";

test.describe("Register Akun", () => {

  const { testAkun } = generateSeedData();

  test("berhasil register dengan data valid", async ({ page }) => {
    await page.goto("/register");
    await page.fill('[name="username"]', testAkun.username);
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/login");
  });

  test("gagal register - email sudah terdaftar", async ({ page }) => {
    await page.goto("/register");
    await page.fill('[name="username"]', testAkun.username);
    await page.fill('[name="email"]', testAkun.email); // email sama
    await page.fill('[name="password"]', testAkun.password);
    await page.click('button[type="submit"]');
    // Harus tetap di register dan muncul error
    await expect(page).toHaveURL("/register");
    await expect(page.locator("p[style*='var(--error)']")).toBeVisible();
  });

  test("gagal register - field kosong", async ({ page }) => {
    await page.goto("/register");
    await page.click('button[type="submit"]');
    // Browser validation mencegah submit
    await expect(page).toHaveURL("/register");
  });

  test("gagal register - email tidak valid", async ({ page }) => {
    await page.goto("/register");
    await page.fill('[name="username"]', testAkun.username);
    await page.fill('[name="email"]', "bukan-email");
    await page.fill('[name="password"]', testAkun.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/register");
  });

});