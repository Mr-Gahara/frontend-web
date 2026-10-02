import { test, expect, type Page } from "@playwright/test";
import {
  ALASAN_TANPA_ADMIN,
  kredensialAdmin,
  loginAdmin,
  type KredensialAdmin,
} from "../../helpers/admin-uji";
import { login } from "../../helpers/transfer-uji";

/*
 * Sesi akun admin platform (keputusan PA1a): login akun menuju panel admin
 * tanpa login pengguna, sesi bertahan setelah muat ulang lewat refresh
 * token akun saja, halaman toko mengembalikan admin ke panel admin, dan
 * logout mengakhiri sesi di backend. Tidak ada data yang ditulis.
 */

const admin = kredensialAdmin();

const POLA_LOGIN_AKUN = /\/api\/akun\/auth\/login(\?|$)/i;
const POLA_REFRESH_AKUN = /\/api\/akun\/auth\/refreshtoken(\?|$)/i;
const POLA_LOGOUT_AKUN = /\/api\/akun\/auth\/logout(\?|$)/i;
const POLA_PIN = /\/api\/pengguna\/pin-(login|refresh)(\?|$)/i;

const judulPanel = (page: Page) => page.getByRole("heading", { name: "Akun Klien" });

function wajibAdmin(): KredensialAdmin {
  if (!admin) throw new Error(ALASAN_TANPA_ADMIN);
  return admin;
}

/**
 * Mencatat permintaan login atau refresh pengguna selama fungsi berjalan.
 * Dengan sejakRespons, pencatatan baru dimulai setelah respons berpola itu
 * diterima: pemulihan sesi di halaman login, sebelum ada akun, memang
 * memanggil pin-refresh dan bukan bagian dari yang diuji.
 */
async function catatPermintaanPin(
  page: Page,
  jalankan: () => Promise<void>,
  sejakRespons?: RegExp,
): Promise<string[]> {
  const daftar: string[] = [];
  let mencatat = !sejakRespons;
  const catat = (r: { url(): string; method(): string }) => {
    if (mencatat && POLA_PIN.test(r.url())) daftar.push(r.method() + " " + new URL(r.url()).pathname);
  };
  const mulai = (r: { url(): string }) => {
    if (sejakRespons?.test(r.url())) mencatat = true;
  };
  page.on("request", catat);
  page.on("response", mulai);
  try {
    await jalankan();
  } finally {
    page.off("request", catat);
    page.off("response", mulai);
  }
  return daftar;
}

test.describe("Sesi admin", () => {
  test.skip(!admin, ALASAN_TANPA_ADMIN);

  test("login admin menuju panel admin tanpa login pengguna", async ({ page }) => {
    let status = 0;
    let isi: Record<string, unknown> = {};
    const permintaanPin = await catatPermintaanPin(page, async () => {
      const respons = await loginAdmin(page, wajibAdmin());
      status = respons.status();
      isi = await respons.json();
      await expect(judulPanel(page)).toBeVisible({ timeout: 15_000 });
    }, POLA_LOGIN_AKUN);

    expect(status).toBe(200);
    expect(isi, "respons admin tanpa requireSetup").not.toHaveProperty("requireSetup");
    expect((isi.data as { role?: string }).role).toBe("admin");
    expect(permintaanPin, "tidak ada permintaan pin setelah login admin").toEqual([]);
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("muat ulang: sesi pulih lewat refresh akun saja", async ({ page }) => {
    await loginAdmin(page, wajibAdmin());
    await expect(judulPanel(page)).toBeVisible({ timeout: 15_000 });

    const permintaanPin = await catatPermintaanPin(page, async () => {
      await page.reload({ waitUntil: "commit" });
      const refresh = await page.waitForResponse(
        (r) => POLA_REFRESH_AKUN.test(r.url()) && r.request().method() === "POST",
      );
      expect(refresh.status(), "refresh akun harus memulihkan sesi").toBe(200);
      await expect(judulPanel(page)).toBeVisible({ timeout: 15_000 });
    });

    expect(permintaanPin, "pin-refresh dilewati untuk akun admin").toEqual([]);
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("halaman toko mengembalikan admin ke panel admin", async ({ page }) => {
    await loginAdmin(page, wajibAdmin());

    await page.goto("/dashboard");
    await page.waitForURL("**/admin");
    await expect(judulPanel(page)).toBeVisible({ timeout: 15_000 });

    await page.goto("/login/pengguna");
    await page.waitForURL("**/admin");
    await expect(judulPanel(page)).toBeVisible({ timeout: 15_000 });
  });

  test("logout mengakhiri sesi dan panel admin tidak dapat dibuka lagi", async ({ page }) => {
    await loginAdmin(page, wajibAdmin());
    await expect(judulPanel(page)).toBeVisible({ timeout: 15_000 });

    const tunggu = page.waitForResponse(
      (r) => POLA_LOGOUT_AKUN.test(r.url()) && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Keluar" }).click();
    expect((await tunggu).status()).toBe(200);
    await page.waitForURL("**/login");

    await page.goto("/admin");
    await page.waitForURL("**/login");
    await expect(judulPanel(page)).toHaveCount(0);
  });
});

test.describe("Panel admin bagi akun klien", () => {
  test("pengguna toko yang membuka panel admin dialihkan ke dashboard", async ({ page }) => {
    await login(page);

    await page.goto("/admin");
    await page.waitForURL(/\/dashboard/);
    await expect(judulPanel(page)).toHaveCount(0);
  });
});