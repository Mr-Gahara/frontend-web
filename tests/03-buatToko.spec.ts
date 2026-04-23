import { test, expect } from "@playwright/test";
import { getSessionItem, decodeJWT } from "./helpers/storage";
import { generateSeedData } from "./helpers/seed";

// Panggil fungsinya untuk mendapatkan data yang 100% fresh khusus untuk file ini
const { testAkun, testToko } = generateSeedData();

// 1. Tambahkan .serial agar Playwright mengeksekusi test berurutan (tidak paralel di dalam file ini)
// Karena test di bawah saling bergantung pada perubahan state di database.
test.describe.serial("Buat Toko", () => {
  
  test.beforeAll(async ({ request }) => {
    // Pastikan port mengarah ke 4000 (Backend)
    const response = await request.post(
      "http://127.0.0.1:4000/api/akun/auth/register",
      {
        data: testAkun,
      }
    );
    expect(response.ok()).toBeTruthy();
  });

  // HAPUS test.beforeEach. Kita akan melakukan login secara eksplisit di tiap test 
  // agar ekspektasi URL-nya bisa disesuaikan dengan skenario masing-masing.

  // --- URUTAN TEST SANGAT PENTING DI SINI ---

  // Test 1: Guarding (Tidak butuh state DB khusus)
  test("redirect ke /login jika tidak ada accessToken", async ({ page }) => {
    await page.goto("/setup/buatToko");
    // Karena tidak ada token, harusnya dilempar ke login
    await expect(page).toHaveURL("/login"); 
    
  });

  // Test 2: Gagal validasi (Akun belum punya toko)
  test("gagal buat toko - nama toko kosong", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    await page.waitForURL("/setup/buatToko"); 

    // Tekan submit tanpa mengisi nama toko
    await page.click('button[type="submit"]');
    
    // Ekspektasi: Tidak berpindah halaman
    await expect(page).toHaveURL("/setup/buatToko");
  });

  // Test 3: Berhasil (INI AKAN MEMUTASI DATABASE, AKUN JADI PUNYA TOKO)
  test("berhasil buat toko - accessToken baru mengandung tenantID", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    await page.waitForURL("/setup/buatToko");

    // Isi nama toko dan submit
    await page.fill('[type="text"]', testToko.namaToko);
    await page.click('button[type="submit"]');

    // Ekspektasi: Lanjut ke buat pengguna owner
    await page.waitForURL("/setup/buatOwner");

    const token = await getSessionItem(page, "accessToken");
    expect(token).not.toBeNull();
    const payload = decodeJWT(token!);

    expect(payload.tenantID).toBeTruthy();
  });

  // Test 4: Redirect jika punya tenant (Akun SEKARANG sudah punya toko karena Test 3)
  test("redirect ke /dashboard (atau pengguna) jika sudah punya tenant", async ({ page }) => {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    // Karena di DB testAkun sudah punya toko, dia tidak boleh masuk ke setup toko lagi
    await expect(page).not.toHaveURL("/setup/buatToko");
  });

});