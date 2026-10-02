import { test, expect } from "@playwright/test";
import { BASIS, login } from "../../helpers/transfer-uji";
import {
  NAMA_PROFIL,
  NAMA_PROFIL_UBAH,
  POLA_PENGGUNA,
  bukaProfil,
  pulihkanPenggunaProfil,
  siapkanPenggunaProfil,
} from "../../helpers/profil-uji";

/*
 * Kaki sidebar setelah dipecah (keputusan PF4a dan PF9a): nama pengguna
 * dari server, avatar tanpa gambar eksternal, tautan profil, logout yang
 * memutus sesi di backend, dan nama yang ikut berubah setelah profil
 * disimpan karena berbagi cache dengan halaman profil.
 */
const POLA_LOGOUT_PENGGUNA = /\/api\/pengguna\/pin-logout(\?|$)/i;
const POLA_LOGOUT_AKUN = /\/api\/akun\/auth\/logout(\?|$)/i;

test.describe("Kaki sidebar", () => {
  test.setTimeout(120_000);

  test("nama dari server, avatar tanpa gambar eksternal, dan menu Profil membuka halaman profil", async ({
    page,
  }) => {
    await login(page);
    const pemicu = page.getByRole("button", { name: /Ridho/ });
    await expect(pemicu).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('img[src*="github.com"]')).toHaveCount(0);

    await pemicu.click();
    await page.getByRole("menuitem", { name: "Profil" }).click();
    await page.waitForURL("**/dashboard/profil");
    await expect(page.getByLabel(/Nama Lengkap/)).toHaveValue("Ridho", { timeout: 20_000 });
  });

  test("logout memutus sesi pengguna dan akun, dan sesi tidak dapat dipulihkan", async ({
    page,
  }) => {
    await login(page);
    const pemicu = page.getByRole("button", { name: /Ridho/ });
    await expect(pemicu).toBeVisible({ timeout: 15_000 });
    await pemicu.click();

    const tPengguna = page.waitForResponse((r) => POLA_LOGOUT_PENGGUNA.test(r.url()));
    const tAkun = page.waitForResponse((r) => POLA_LOGOUT_AKUN.test(r.url()));
    await page.getByRole("menuitem", { name: "Logout" }).click();
    expect((await tPengguna).status(), "pin-logout").toBeLessThan(400);
    expect((await tAkun).status(), "logout akun").toBeLessThan(400);
    await page.waitForURL(/\/login$/);

    // Cookie refresh sudah tidak berlaku: membuka dashboard kembali ke login.
    await page.goto(BASIS + "/dashboard");
    await page.waitForURL(/\/login$/);
  });

  test("nama di sidebar ikut berubah setelah profil disimpan", async ({ page, browser }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await expect(hal.getByRole("button", { name: new RegExp(NAMA_PROFIL) })).toBeVisible();
      await hal.getByLabel(/Nama Lengkap/).fill(NAMA_PROFIL_UBAH);
      const tunggu = hal.waitForResponse(
        (r) => r.request().method() === "PUT" && POLA_PENGGUNA.test(r.url()),
      );
      await hal.getByRole("button", { name: "Simpan Perubahan" }).click();
      expect((await tunggu).status()).toBe(200);
      await expect(hal.getByRole("button", { name: new RegExp(NAMA_PROFIL_UBAH) })).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await ctx.close();
      const pulih = await pulihkanPenggunaProfil(page, auth, id);
      expect.soft(pulih.status, `pulihkan: ${pulih.pesan}`).toBe(200);
    }
  });
});