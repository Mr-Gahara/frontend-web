import { test, expect } from "@playwright/test";
import { generateSeedData } from "./helpers/seed";

const { testAkun, testToko, testOwner } = generateSeedData();

test.describe.serial("Chaos Engineering & Security", () => {

  test.beforeAll(async ({ request }) => {
    // Setup standar
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

  // --- SKENARIO 1: INTERNET MATI (OFFLINE MODE) ---
  test("menangani pemutusan jaringan secara anggun tanpa infinite loading", async ({ page, context }) => {
    await masukKeDashboard(page);
    await page.goto("/roles/buatRole");

    await page.fill('[placeholder="contoh: Kasir"]', "Role Tanpa Internet");
    await page.waitForSelector('input[type="checkbox"]');
    await page.locator('input[type="checkbox"]').first().check();

    // INTERCEPTION: Kita matikan total koneksi internet browser ini
    await context.setOffline(true);

    await page.click('button[type="submit"]');

    // Ekspektasi: UI kembali normal (tidak loading selamanya) dan memunculkan pesan error
    // Catatan: Teks pesan mungkin berbeda tergantung konfigurasi axios/fetch di apiClient.ts Anda
    const errorText = page.locator("p[style*='var(--error)']");
    await expect(errorText).toBeVisible();
    
    // Kembalikan koneksi agar tidak merusak tes selanjutnya
    await context.setOffline(false);
  });

  // --- SKENARIO 2: XSS INJECTION ---
  test("kebal terhadap serangan injeksi XSS pada input form", async ({ page }) => {
    await masukKeDashboard(page);
    await page.goto("/roles/buatRole");

    // Kita masukkan payload XSS berbahaya yang sering digunakan hacker
    const xssPayload = "<img src=x onerror=alert('HACKED') />";
    
    await page.fill('[placeholder="contoh: Kasir"]', xssPayload);
    await page.waitForSelector('input[type="checkbox"]');
    await page.locator('input[type="checkbox"]').first().check();

    // Deteksi jika muncul pop-up alert (dialog) yang berarti aplikasi jebol
    page.on("dialog", (dialog) => {
      // Jika masuk ke sini, berarti script tereksekusi! Kita gagalkan tesnya.
      expect(dialog.message()).not.toContain("HACKED");
      dialog.dismiss();
    });

    await page.click('button[type="submit"]');
    await page.waitForURL("/roles");

    // Trik aman bypass Next.js Router Cache (seperti yang sudah kita pelajari)
    await page.goto("/dashboard");
    await page.goto("/roles");

    // Ekspektasi: Teks harus dirender sebagai teks biasa, BUKAN sebagai elemen HTML aktif
    await expect(page.getByText(xssPayload)).toBeVisible({ timeout: 10000 });
  });

});