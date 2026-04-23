import { test, expect } from "@playwright/test";
import { getSessionItem, getLocalItem, decodeJWT } from "./helpers/storage";
import { generateSeedData } from "./helpers/seed";

// Panggil fungsinya untuk mendapatkan data yang 100% fresh khusus untuk file ini
const { testAkun } = generateSeedData();

test.describe.serial("Login Akun", () => {
  test.beforeAll(async ({ request }) => {
    // Gunakan 127.0.0.1 untuk memastikan tidak ada isu resolusi IPv6 di Node.js
    const response = await request.post(
      "http://127.0.0.1:4000/api/akun/auth/register",
      {
        data: testAkun,
      },
    );

    if (!response.ok()) {
      const errorBody = await response.text();
      console.error("❌ BACKEND MENOLAK REGISTER:", response.status(), errorBody);
    }

    // Pastikan seeding data berhasil sebelum lanjut
    expect(response.ok()).toBeTruthy();
  });

  test("berhasil login - accessToken tersimpan di sessionStorage", async ({ page }) => {
    await page.goto("/login");
    // Karena kita sudah hit API register di beforeAll, email dinamis ini PASTI ada di DB
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    // Jeda (Waiter): Memaksa Playwright menunggu hingga login selesai
    await expect(page).not.toHaveURL("/login");

    const token = await getSessionItem(page, "accessToken");
    expect(token).not.toBeNull();
    expect(token!.split(".").length).toBe(3);
  });

  test("berhasil login - JWT payload berisi id dan role", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    // TAMBAHAN: Jeda menunggu respon API selesai sebelum membaca sessionStorage
    await expect(page).not.toHaveURL("/login", { timeout: 15000 });

    const token = await getSessionItem(page, "accessToken");
    const payload = decodeJWT(token!);

    expect(payload.id).toBeTruthy();
    expect(payload.role).toBe("client");
  });

  test("berhasil login - data akun tersimpan di localStorage", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    // TAMBAHAN: Jeda menunggu respon API selesai
    await expect(page).not.toHaveURL("/login");

    const raw = await getLocalItem(page, "akun");
    expect(raw).not.toBeNull();
    const akun = JSON.parse(raw!);
    
    expect(akun.email).toBe(testAkun.email);
    // PERBAIKAN: Backend Anda menggunakan key '_id', bukan 'id'
    expect(akun._id).toBeTruthy();
  });

  test("gagal login - password salah", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', "passwordsalah");
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/login");
    await expect(page.locator("p[style*='var(--error)']")).toBeVisible();
  });

  test("gagal login - email tidak terdaftar", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', "tidakada@gmail.com");
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/login");
    await expect(page.locator("p[style*='var(--error)']")).toBeVisible();
  });

  test("gagal login - deviceID kosong", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    // deviceID tidak diisi
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/login");
  });

  test("redirect ke /setup/buatToko jika belum punya tenant", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    // PERBAIKAN: Tunggu aplikasi melakukan redirect TERLEBIH DAHULU sebelum membaca token.
    // Ini menghilangkan potensi error null saat decodeJWT.
    await expect(page).toHaveURL("/setup/buatToko");

    const token = await getSessionItem(page, "accessToken");
    const payload = decodeJWT(token!);

    // Validasi ekstra: pastikan token memang tidak memiliki tenantID
    expect(payload.tenantID).toBeFalsy(); 
  });
});