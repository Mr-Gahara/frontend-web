import { test, expect } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Masa tenggang rotasi pin-refresh (kontrak/temuan.md butir 185; backend
 * P83, B345). Bila halaman ditinggal saat pin-refresh sudah diproses backend
 * tetapi responsnya belum diterima, browser tetap memegang cookie lama.
 * Sejak B345 versi sebelum rotasi terakhir masih diterima 30 detik, sehingga
 * dokumen berikutnya memulihkan sesi, bukan terlempar ke login pengguna.
 *
 * Repro yang sama dengan pembuktian butir 185 (f80bd16): route.fetch membuat
 * backend memutar token, cookie lama dikembalikan ke browser, permintaannya
 * dibatalkan, lalu halaman lain dibuka. Tidak ada data yang ditulis.
 */

const POLA_REFRESH = /\/api\/pengguna\/pin-refresh(\?|$)/i;

test.describe("Masa tenggang pin-refresh", () => {
  test("pin-refresh yang terpotong navigasi tidak memutus sesi pengguna", async ({ page }) => {
    await login(page);
    const sidebar = page.locator("[data-sidebar=sidebar]").first();
    await expect(sidebar.getByText("Pelanggan", { exact: true })).toBeVisible({ timeout: 15_000 });

    const cookieLama = await page.context().cookies();
    let mulai = false;
    let diputar = false;
    await page.route(POLA_REFRESH, async (route) => {
      if (mulai || route.request().method() !== "POST") return route.continue();
      mulai = true;
      const res = await route.fetch();
      expect(res.status(), "backend memproses pin-refresh dan memutar token").toBe(200);
      // Respons tidak sampai ke browser: cookie hasil rotasi dibuang.
      await page.context().clearCookies();
      await page.context().addCookies(cookieLama);
      await route.abort();
      diputar = true;
    });

    await page.reload({ waitUntil: "commit" });
    await expect.poll(() => diputar, { timeout: 15_000 }).toBe(true);

    await page.unroute(POLA_REFRESH);
    const pulih = page.waitForResponse(
      (r) => POLA_REFRESH.test(r.url()) && r.request().method() === "POST",
    );
    await page.goto("/dashboard/outlet/pelanggan", { waitUntil: "commit" });
    const refresh = await pulih;
    expect(refresh.status(), "cookie lama masih diterima dalam masa tenggang").toBe(200);

    await expect(sidebar.getByText("Pelanggan", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page).not.toHaveURL(/\/login/);
  });
});
