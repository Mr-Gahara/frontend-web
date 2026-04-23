import { test, expect } from "@playwright/test";
import { generateSeedData } from "./helpers/seed";

const { testAkun, testToko, testOwner, testRole } = generateSeedData();

test.describe.serial("System Failure & Edge Cases", () => {

  test.beforeAll(async ({ request }) => {
    // Setup standar: Akun, Toko, Owner siap pakai
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

  // --- SKENARIO 2: SERVER 500 ERROR ---
  test("menampilkan error UI yang ramah saat backend melempar 500 Internal Error", async ({ page }) => {
    await masukKeDashboard(page);
    await page.goto("/roles/buatRole");

    await page.fill('[placeholder="contoh: Kasir"]', testRole.namaRole);
    await page.waitForSelector('input[type="checkbox"]');
    await page.locator('input[type="checkbox"]').first().check();

    // INTERCEPTION: Kita bajak jaringan, paksa backend seolah-olah hancur total
    await page.route("**/api/role", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error. Database connection lost." }),
      });
    });

    await page.click('button[type="submit"]');

    // Ekspektasi: UI tidak nge-blank, form tetap ada, dan muncul pesan error merah
    await expect(page).toHaveURL("/roles/buatRole");
    const errorText = page.locator("p[style*='var(--error)']");
    await expect(errorText).toBeVisible();
    
    // Memastikan aplikasi tidak crash (h1 masih ter-render)
    await expect(page.locator("h1")).toContainText("Buat Role");
  });

  // --- SKENARIO 3: SPAM CLICK UI ---
  test("tombol submit langsung ter-disable setelah diklik untuk mencegah spam data", async ({ page }) => {
    await masukKeDashboard(page);
    await page.goto("/roles/buatRole");

    await page.fill('[placeholder="contoh: Kasir"]', "Role Spam");
    await page.waitForSelector('input[type="checkbox"]');
    await page.locator('input[type="checkbox"]').first().check();

    const submitBtn = page.locator('button[type="submit"]');
    
    // Trik Playwright: Kita perlambat jaringan agar kita punya waktu melihat status tombol
    await page.route("**/api/role", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 2 detik
      await route.continue();
    });

    // Klik satu kali
    await submitBtn.click();

    // Ekspektasi: Dalam waktu kurang dari 2 detik itu, tombol harus dalam keadaan disabled
    await expect(submitBtn).toBeDisabled();
    
    // Pastikan teks tombol berubah menjadi teks loading (sesuai kode React Anda)
    await expect(submitBtn).toContainText("Membuat role...");
  });

});