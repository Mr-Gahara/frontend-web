import { test, expect } from "@playwright/test";
import { BASIS, JAWAB_GAGAL, login } from "../../helpers/transfer-uji";
import { POLA_PENGGUNA } from "../../helpers/profil-uji";

/*
 * Profil yang gagal dimuat (referensi/utang-pengujian.md): pesan galat dan
 * Coba Lagi di halaman profil. Galat server tidak dapat dibuat backend
 * secara deterministik, sehingga GET /pengguna/:id dijawab 500 lewat
 * route.fulfill (keputusan rancangan butir 21), lalu dilepas sebelum Coba
 * Lagi sehingga keberhasilannya dari respons nyata.
 */

test("profil gagal dimuat: pesan backend dan Coba Lagi memuat datanya", async ({ page }) => {
  await login(page);
  const cocokDetail = (url: URL) => POLA_PENGGUNA.test(url.pathname);
  await page.route(cocokDetail, (route) =>
    route.request().method() === "GET" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
  );
  await page.goto(BASIS + "/dashboard/profil");
  await expect(page.getByText("uji", { exact: true })).toBeVisible({ timeout: 20_000 });
  const coba = page.getByRole("button", { name: "Coba Lagi" });
  await expect(coba).toBeVisible();

  await page.unroute(cocokDetail);
  const tDetail = page.waitForResponse((r) => r.request().method() === "GET" && POLA_PENGGUNA.test(r.url()));
  await coba.click();
  expect((await tDetail).status()).toBe(200);
  await expect(page.getByLabel(/Nama Lengkap/)).toHaveValue("Ridho", { timeout: 20_000 });
  await expect(coba).toHaveCount(0);
});
