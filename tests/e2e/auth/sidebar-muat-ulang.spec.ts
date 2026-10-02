import { test, expect, type Page } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Sidebar setelah halaman dimuat ulang (keputusan PO16a). Token hanya hidup
 * di memori, sehingga setiap muat ulang memulihkan sesi lewat pin-refresh,
 * dan sidebar terpasang sebelum pemulihan itu selesai. Menu berizin dan
 * pilihan ruang harus tetap tampil setelah sesi pulih. Tidak ada data yang
 * ditulis.
 */

const POLA_REFRESH = /\/api\/pengguna\/pin-refresh(\?|$)/i;

const menuBerizin = (page: Page) =>
  page.getByRole("button", { name: "Sesi Booking & Reservasi" });

test.describe("Sidebar setelah muat ulang", () => {
  test("menu berizin dan pilihan ruang tetap tampil setelah sesi pulih", async ({ page }) => {
    await login(page);
    await expect(menuBerizin(page)).toBeVisible({ timeout: 15_000 });

    await page.reload({ waitUntil: "commit" });
    const refresh = await page.waitForResponse(
      (r) => POLA_REFRESH.test(r.url()) && r.request().method() === "POST",
    );
    expect(refresh.status(), "pin-refresh harus memulihkan sesi").toBe(200);

    await expect(menuBerizin(page)).toBeVisible({ timeout: 15_000 });
    await page.getByText("Outlet Ops.").click();
    await expect(page.getByRole("menuitem", { name: /ruang gudang/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});