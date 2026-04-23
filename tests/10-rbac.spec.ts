import { test, expect } from "@playwright/test";
import { generateSeedData } from "./helpers/seed";

const { testAkun, testToko, testOwner } = generateSeedData();

test.describe.serial("Keamanan RBAC & Otorisasi", () => {

  // SETUP: Siapkan Akun dan Owner seperti biasa
  test.beforeAll(async ({ request }) => {
    const regRes = await request.post("http://127.0.0.1:4000/api/akun/auth/register", { data: testAkun });
    expect(regRes.ok()).toBeTruthy();
    
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

  // Helper Login Penuh ke Dashboard
  async function masukKeDashboard(page: any) {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID); 
    await page.click('button[type="submit"]');
    
    await page.waitForURL("/login/pengguna");

    await page.fill('[name="nama"]', testOwner.nama);
    await page.fill('[name="pin"]', testOwner.pin);
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  }

  // --- SKENARIO 4: PENCEGAHAN AKSES ILEGAL (403 FORBIDDEN) ---
  test("menangkap error 403 saat pengguna mengakses halaman di luar hak izinnya", async ({ page }) => {
    await masukKeDashboard(page);

    // INTERCEPTION: Kita bajak jaringan. 
    // Seolah-olah yang sedang login adalah 'Kasir', dan backend menolak akses ke data Roles.
    await page.route("**/api/role*", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ message: "Akses ditolak. Anda tidak memiliki permission: read-role" }),
      });
    });

    // Pengguna nakal memaksa mengetik URL sensitif di browser
    await page.goto("/roles");

    // EKSPEKTASI: 
    // Karena aplikasi Anda menangkap error API dan menampilkannya di UI (seperti kasus 404 sebelumnya),
    // kita memastikan pesan peringatan dari backend berhasil dirender agar pengguna sadar mereka diblokir.
    
    const errorMessage = page.locator("p[style*='var(--error)']");
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText("Akses ditolak");
    
    // Pastikan tidak ada data sensitif (tabel list roles) yang bocor/ter-render secara tidak sengaja
    await expect(page.locator("text=Owner")).not.toBeVisible();
  });

});