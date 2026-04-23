import { test, expect } from "@playwright/test";
import { getSessionItem, decodeJWT } from "./helpers/storage";

test.describe("Full Flow — Fresh Account", () => {

  const ts = Date.now();
  const akun = {
    username: `flow_${ts}`,
    email: `flow_${ts}@gmail.com`,
    password: "password123",
    deviceID: `device-flow-${ts}`,
  };

  test("register → login → buat toko → buat owner → login pengguna → dashboard", async ({ page }) => {
    // 1. Register
    await page.goto("/register");
    await page.fill('[name="username"]', akun.username);
    await page.fill('[name="email"]', akun.email);
    await page.fill('[name="password"]', akun.password);
    await page.click('button[type="submit"]');
    
    // Tunggu sampai redirect ke login sebagai bukti register sukses
    await expect(page).toHaveURL("/login");

    // 2. Login akun
    await page.fill('[name="email"]', akun.email);
    await page.fill('[name="password"]', akun.password);
    await page.fill('[name="deviceID"]', akun.deviceID);
    await page.click('button[type="submit"]');
    
    // WAJIB DITUNGGU: URL harus benar-benar pindah sebelum cek Storage
    await expect(page).toHaveURL("/setup/buatToko");

    // Verifikasi accessToken1 — belum punya tenantID
    const token1 = await getSessionItem(page, "accessToken");
    expect(token1).not.toBeNull();
    const payload1 = decodeJWT(token1!);
    expect(payload1.tenantID).toBeFalsy();

    // 3. Buat Toko
    await page.fill('[type="text"]', `Toko Flow ${ts}`);
    await page.click('button[type="submit"]');
    
    // WAJIB DITUNGGU: URL pindah ke buatOwner
    await expect(page).toHaveURL("/setup/buatOwner");

    // Verifikasi accessToken2 — sudah punya tenantID
    const token2 = await getSessionItem(page, "accessToken");
    expect(token2).not.toBeNull();
    const payload2 = decodeJWT(token2!);
    
    expect(payload2.tenantID).toBeTruthy();
    
    // CATATAN: Saya menggunakan '||' untuk mengakomodasi perbedaan penamaan variabel backend
    // Jika role tidak ada sama sekali di tahap ini, silakan hapus baris ini.
    expect(payload2.roleID || payload2.role).toBeTruthy(); 
    expect(token2).not.toBe(token1); // Token harus diperbarui oleh backend

    // 4. Buat Owner
    await page.fill('[name="nama"]', `owner_flow_${ts}`);
    await page.fill('[name="pin"]', "222222");
    await page.click('button[type="submit"]');
    
    // Tunggu redirect ke dashboard
    await expect(page).toHaveURL("/dashboard");

    // Verifikasi penggunaToken
    const penggunaToken = await getSessionItem(page, "penggunaToken");
    expect(penggunaToken).not.toBeNull();
    
    const penggunaPayload = decodeJWT(penggunaToken!);
    expect(penggunaPayload.tenantID).toBeTruthy();
    expect(penggunaPayload.roleID || penggunaPayload.role).toBeTruthy();
  });

});