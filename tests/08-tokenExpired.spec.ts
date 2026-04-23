import { test, expect } from "@playwright/test";
import { generateSeedData } from "./helpers/seed";

const { testAkun, testToko, testOwner, testRole } = generateSeedData();

test.describe.serial("Skenario Token Expired & Unauthorized", () => {

  // SETUP: Siapkan 1 akun matang via API murni untuk dites
  test.beforeAll(async ({ request }) => {
    const regRes = await request.post("http://127.0.0.1:4000/api/akun/auth/register", { data: testAkun });
    expect(regRes.ok()).toBeTruthy();
    
    const loginRes = await request.post("http://127.0.0.1:4000/api/akun/auth/login", { data: testAkun });
    expect(loginRes.ok()).toBeTruthy();
    const { accessToken } = await loginRes.json();
    
    const tokoRes = await request.post("http://127.0.0.1:4000/api/tenant", {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { namaToko: testToko.namaToko },
    });
    expect(tokoRes.ok()).toBeTruthy();
    const { accessToken: newToken } = await tokoRes.json();

    const ownerRes = await request.post("http://127.0.0.1:4000/api/pengguna/register-owner", {
      headers: { Authorization: `Bearer ${newToken}` },
      data: { nama: testOwner.nama, pin: testOwner.pin },
    });
    expect(ownerRes.ok()).toBeTruthy();
  });

  // Helper Login Penuh
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

  // --- SKENARIO 1: Token Hilang/Expired saat navigasi (Client-side) ---
  test("ditendang ke /login jika token tiba-tiba hilang dari storage", async ({ page }) => {
    await masukKeDashboard(page);
    
    // Simulasi: Token terhapus atau expired dan dibersihkan oleh sistem
    await page.evaluate(() => {
      sessionStorage.removeItem("penggunaToken");
      sessionStorage.removeItem("accessToken");
    });

    // Coba pindah ke halaman roles (useAuthGuard harusnya bereaksi)
    await page.goto("/roles");
    
    // Ekspektasi: Langsung ditendang ke login
    await expect(page).toHaveURL("/login");
  });

  // --- SKENARIO 2: Token Expired SAAT ingin buat Role (API Interception) ---
  test("gagal buat role karena token expired di tengah jalan (401 Unauthorized)", async ({ page }) => {
    await masukKeDashboard(page);
    await page.goto("/roles/buatRole");

    await page.fill('[placeholder="contoh: Kasir"]', testRole.namaRole);
    await page.waitForSelector('input[type="checkbox"]');
    await page.locator('input[type="checkbox"]').first().check();

    // INTERCEPTION: Kita bajak request ke backend, dan paksa kembalikan error 401
    await page.route("**/api/role", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Token expired atau tidak valid." }),
      });
    });

    await page.click('button[type="submit"]');

    // CATATAN KRITIS UNTUK TUAN:
    // Tergantung bagaimana Anda merancang apiClient.ts di frontend, 
    // jika 401 terjadi, apakah UI memunculkan teks error merah? Atau langsung auto-logout?
    
    // Jika memunculkan error merah di form:
    await expect(page.locator("p[style*='var(--error)']")).toBeVisible();
    await expect(page.locator("p[style*='var(--error)']")).toContainText("Token expired");
    
    // JIKA aplikasi Anda diatur untuk auto-logout saat 401, gunakan ekspektasi ini:
    // await expect(page).toHaveURL("/login");
  });

  // --- SKENARIO 3: Token Expired SAAT ingin buat Tenant ---
  test("gagal buat tenant karena token expired (401 Unauthorized)", async ({ page, request }) => {
    // Kita buat akun "setengah matang" baru khusus tes ini (Belum punya toko)
    const seedBaru = generateSeedData();
    await request.post("http://127.0.0.1:4000/api/akun/auth/register", { data: seedBaru.testAkun });
    
    // Login akun baru tersebut
    await page.goto("/login");
    await page.fill('[name="email"]', seedBaru.testAkun.email);
    await page.fill('[name="password"]', seedBaru.testAkun.password);
    await page.fill('[name="deviceID"]', seedBaru.testAkun.deviceID);
    await page.click('button[type="submit"]');
    
    await page.waitForURL("/setup/buatToko");

    // INTERCEPTION: Bajak request buat tenant
    await page.route("**/api/tenant", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Sesi telah berakhir." }),
      });
    });

    await page.fill('[type="text"]', "Toko Expired");
    await page.click('button[type="submit"]');

    // Validasi sesuai UX Anda (muncul error merah di layar)
    await expect(page.locator("p[style*='var(--error)']")).toBeVisible();
  });

});