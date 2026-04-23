import { test, expect } from "@playwright/test";
import { getSessionItem, decodeJWT } from "./helpers/storage";
import { generateSeedData } from "./helpers/seed";

// Panggil fungsinya untuk mendapatkan data yang 100% fresh khusus untuk file ini
const { testAkun, testToko, testOwner } = generateSeedData();

// Menggunakan .serial agar dieksekusi dari atas ke bawah tanpa konflik data
test.describe.serial("Buat Pengguna Owner", () => {
  
  test.beforeAll(async ({ request }) => {
    // 1. Wajib: Suntikkan data akun ke Backend (Port 4000)
    const response = await request.post(
      "http://127.0.0.1:4000/api/akun/auth/register",
      {
        data: testAkun,
      }
    );

    if (!response.ok()) {
      const errorBody = await response.text();
      console.error("❌ BACKEND MENOLAK REGISTER:", response.status(), errorBody);
    }

    expect(response.ok()).toBeTruthy();
  });

  // Fungsi helper khusus untuk melewati gerbang login & toko
  async function masukKeHalamanBuatOwner(page: any) {
    await page.goto("/login");
    await page.fill('[name="email"]', testAkun.email);
    await page.fill('[name="password"]', testAkun.password);
    await page.fill('[name="deviceID"]', testAkun.deviceID);
    await page.click('button[type="submit"]');

    // Tunggu Next.js memutuskan arah:
    await page.waitForURL(/\/(setup\/buatToko|setup\/buatOwner|login\/pengguna)/);
    
    if (page.url().includes("buatToko")) {
      await page.fill('[type="text"]', testToko.namaToko);
      await page.click('button[type="submit"]');
      await page.waitForURL("/setup/buatOwner");
    } else if (page.url().includes("pengguna")) {
      // Jika Next.js melempar ke sini karena tenantID sudah ada, paksa kembali ke setup owner
      await page.goto("/setup/buatOwner");
    }
  }

  // --- Urutan Test Dimulai ---

  // Test 1: Eksekusi tes tanpa token pertama kali
  test("redirect ke /login jika tidak ada accessToken", async ({ page }) => {
    await page.goto("/setup/buatOwner");
    await expect(page).toHaveURL("/login");
  });

  // Test 2: Tes validasi (Memulai mutasi UI pertama)
  test("gagal buat owner - field kosong", async ({ page }) => {
    await masukKeHalamanBuatOwner(page);
    
    // Langsung klik tanpa isi data
    await page.click('button[type="submit"]');
    
    // Harus tetap tertahan di halaman yang sama
    await expect(page).toHaveURL("/setup/buatOwner");
  });

  // Test 3: Tes validasi PIN
  test("gagal buat owner - PIN kurang dari 6 digit", async ({ page }) => {
    await masukKeHalamanBuatOwner(page);
    
    await page.fill('[name="nama"]', testOwner.nama);
    await page.fill('[name="pin"]', "123"); // Sengaja dibuat salah
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL("/setup/buatOwner");
  });

  // Test 4: Eksekusi keberhasilan (Memutasi Database)
  test("berhasil buat pengguna owner", async ({ page }) => {
    await masukKeHalamanBuatOwner(page);
    
    await page.fill('[name="nama"]', testOwner.nama);
    await page.fill('[name="pin"]', testOwner.pin);
    await page.click('button[type="submit"]');
    
    // Ekspektasi: diarahkan ke halaman dashboard
    await page.waitForURL("/dashboard");    
  });

});