import { expect, test } from "@playwright/test";
import { AKUN_UJI, tombolMasuk } from "../../helpers/masuk-uji";

const POLA_LOGIN_AKUN = /\/api\/akun\/auth\/login$/;

test.describe("Tampilan login akun", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("panel toko dan form tampil dengan judul yang dikenali pengguna", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Buka toko, mulai shift." })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Masuk ke akun toko" })).toBeVisible();
    await expect(tombolMasuk(page)).toHaveText("Masuk");
  });

  test("tombol Tampilkan membuka dan menutup isi password", async ({ page }) => {
    const sandi = page.getByLabel("Password", { exact: true });
    await sandi.fill("RahasiaUji1");
    await expect(sandi).toHaveAttribute("type", "password");

    const tampilkan = page.getByRole("button", { name: "Tampilkan" });
    await expect(tampilkan).toHaveAttribute("aria-pressed", "false");
    await tampilkan.click();
    await expect(sandi).toHaveAttribute("type", "text");

    const sembunyikan = page.getByRole("button", { name: "Sembunyikan" });
    await expect(sembunyikan).toHaveAttribute("aria-pressed", "true");
    await sembunyikan.click();
    await expect(sandi).toHaveAttribute("type", "password");
  });

  test("selama permintaan berjalan tombol menunjukkan sedang memeriksa akun", async ({ page }) => {
    let lepas: () => void = () => {};
    const tertahan = new Promise<void>((r) => (lepas = r));
    await page.route(POLA_LOGIN_AKUN, async (route) => {
      await tertahan;
      await route.continue();
    });

    await page.getByLabel(/email/i).fill(AKUN_UJI.email);
    await page.getByLabel("Password", { exact: true }).fill(AKUN_UJI.password);
    await tombolMasuk(page).click();

    await expect(page.getByRole("button", { name: /memeriksa akun/i })).toBeDisabled();
    lepas();
    await page.waitForURL("**/login/pengguna");
  });
});