import { test, expect } from "@playwright/test";
import { generateSeedData } from "./helpers/seed";

// Panggil fungsinya untuk mendapatkan data yang 100% fresh khusus untuk file ini
const { testAkun, testToko, testOwner, testRole } = generateSeedData();

test.describe.serial("Roles", () => {

  // SETUP: API Murni (Jauh lebih cepat dan anti-timeout)
  test.beforeAll(async ({ request }) => {
    // Beri proteksi expect(.ok()) di setiap pemanggilan API agar errornya langsung ketahuan
    const regRes = await request.post("http://127.0.0.1:4000/api/akun/auth/register", { data: testAkun });
    if (!regRes.ok()) {
      const errorBody = await regRes.text();
      console.error("❌ BACKEND MENOLAK REGISTER:", regRes.status(), errorBody);
    }
    
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

  // Helper Login
  async function masukKeDashboard(page: any) {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    // KEMBALIKAN KE NORMAL: Jangan gunakan Date.now()
    await page.fill('[name="deviceID"]', testAkun.deviceID); 
    await page.click('button[type="submit"]');
    
    await page.waitForURL("/login/pengguna");

    await page.fill('[name="nama"]', testOwner.nama);
    await page.fill('[name="pin"]', testOwner.pin);
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  }

  // --- URUTAN TEST DIMULAI ---

  test("halaman roles tidak bisa diakses tanpa login", async ({ page }) => {
    await page.goto("/roles");
    await expect(page).toHaveURL("/login");
  });

  test("berhasil lihat list roles", async ({ page }) => {
    await masukKeDashboard(page);
    await page.goto("/roles");
    
    await expect(page.locator("h1")).toContainText("Roles");
  });

  test("gagal buat role - nama kosong", async ({ page }) => {
    await masukKeDashboard(page);
    await page.goto("/roles/buatRole");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/roles/buatRole");
  });

  test("gagal buat role - tidak pilih permission", async ({ page }) => {
    await masukKeDashboard(page);
    await page.goto("/roles/buatRole");

    await page.fill('[placeholder="contoh: Kasir"]', testRole.namaRole);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/roles/buatRole");
    await expect(page.locator("p[style*='var(--error)']")).toContainText("Pilih minimal 1 permission");
  });

  test("berhasil buat role baru dan langsung muncul di list", async ({ page }) => {
    await masukKeDashboard(page);
    await page.goto("/roles/buatRole");

    await page.fill('[placeholder="contoh: Kasir"]', testRole.namaRole);
    await page.fill('[placeholder="contoh: Akses kasir harian"]', testRole.deskripsi);

    await page.waitForSelector('input[type="checkbox"]');
    await page.locator('input[type="checkbox"]').first().check();
    await page.click('button[type="submit"]');

    await page.waitForURL("/roles");
    await page.goto("/dashboard");
    await page.goto("/roles");
    await expect(page.getByText(new RegExp(testRole.namaRole, 'i'))).toBeVisible({ timeout: 15000 });
  });

});