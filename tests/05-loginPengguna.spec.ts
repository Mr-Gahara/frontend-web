import { test, expect } from "@playwright/test";
import { getSessionItem, decodeJWT } from "./helpers/storage";
import { generateSeedData } from "./helpers/seed";

// Panggil fungsinya untuk mendapatkan data yang 100% fresh khusus untuk file ini
const { testAkun, testToko, testOwner, testRole } = generateSeedData();

test.describe.serial("Login Pengguna", () => {

  test.beforeAll(async ({ request }) => {
    await request.post("http://127.0.0.1:4000/api/akun/auth/register", { data: testAkun });
    const loginRes = await request.post("http://127.0.0.1:4000/api/akun/auth/login", { data: testAkun });
    const { accessToken } = await loginRes.json();
    
    const tokoRes = await request.post("http://127.0.0.1:4000/api/tenant", {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { namaToko: testToko.namaToko },
    });
    const { accessToken: newToken } = await tokoRes.json();

    await request.post("http://127.0.0.1:4000/api/pengguna/register-owner", {
      headers: { Authorization: `Bearer ${newToken}` },
      data: { nama: testOwner.nama, pin: testOwner.pin },
    });
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');
    
    await page.waitForURL("/login/pengguna");
  });

  test("berhasil login pengguna - penggunaToken tersimpan", async ({ page }) => {
    // RESTORASI: Isi PIN agar bisa login
    await page.fill('[name="nama"]', testOwner.nama);
    await page.fill('[name="pin"]', testOwner.pin);
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    const token = await getSessionItem(page, "penggunaToken");
    expect(token).not.toBeNull();
    expect(token!.split(".").length).toBe(3);
  });

  test("berhasil login pengguna - JWT payload berisi roleID dan tenantID", async ({ page }) => {
    // RESTORASI: Isi PIN
    await page.fill('[name="nama"]', testOwner.nama);
    await page.fill('[name="pin"]', testOwner.pin);
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    const token = await getSessionItem(page, "penggunaToken");
    const payload = decodeJWT(token!);

    expect(payload._id || payload.id).toBeTruthy(); 
    expect(payload.tenantID).toBeTruthy();
    expect(payload.roleID || payload.role).toBeTruthy();
  });

  test("gagal login pengguna - PIN salah", async ({ page }) => {
    await page.fill('[name="nama"]', testOwner.nama);
    await page.fill('[name="pin"]', "999999");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/login/pengguna");
    await expect(page.locator("p[style*='var(--error)']")).toBeVisible();
  });

  test("gagal login pengguna - nama tidak ada", async ({ page }) => {
    await page.fill('[name="nama"]', "tidakada");
    await page.fill('[name="pin"]', testOwner.pin);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/login/pengguna");
    await expect(page.locator("p[style*='var(--error)']")).toBeVisible();
  });

});