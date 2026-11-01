import { test, expect } from "@playwright/test";
import { masukAkun } from "../../helpers/masuk-uji";

/*
 * Tampilan login pengguna desain E (Layar Kunci), modul/setup-akun.md.
 * Jam dipatok lewat page.clock.setFixedTime: Date.now() tetap, sedangkan
 * timer halaman tetap berjalan, sehingga detak per detik membaca jam patokan.
 * Patokan berada sebelum waktu nyata, jadi token akun tidak dianggap
 * kedaluwarsa oleh pemeriksaan exp di klien.
 */
test.use({ timezoneId: "Asia/Jakarta", locale: "id-ID" });

const JAM_PATOKAN = new Date("2026-11-01T08:05:00Z");
const BANTUAN_LUPA_PIN = /minta Owner mengatur ulang PIN/i;

test.describe("Tampilan login pengguna", () => {
  test("judul, merek, tombol masuk, dan tombol keluar tampil", async ({ page }) => {
    await masukAkun(page);
    await expect(page.getByRole("heading", { level: 1, name: "Siapa yang bertugas?" })).toBeVisible();
    await expect(page.getByText("Tachyon POS")).toBeVisible();
    await expect(page.getByRole("button", { name: "Masuk ke kasir" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Keluar dari akun toko" })).toBeVisible();
  });

  test("jam dan tanggal mengikuti waktu sekarang dan berganti saat menit berganti", async ({ page }) => {
    await page.clock.setFixedTime(JAM_PATOKAN);
    await masukAkun(page);
    const jam = page.locator("time");
    await expect(jam).toHaveText("15.05");
    await expect(page.getByText("Minggu, 1 November 2026")).toBeVisible();

    await page.clock.setFixedTime(new Date(JAM_PATOKAN.getTime() + 60_000));
    await expect(jam).toHaveText("15.06");
  });

  test("Lupa PIN? membuka dan menutup bantuan", async ({ page }) => {
    await masukAkun(page);
    const lupa = page.getByRole("button", { name: "Lupa PIN?" });
    await expect(lupa).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText(BANTUAN_LUPA_PIN)).toBeHidden();

    await lupa.click();
    await expect(lupa).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText(BANTUAN_LUPA_PIN)).toBeVisible();

    await lupa.click();
    await expect(lupa).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText(BANTUAN_LUPA_PIN)).toBeHidden();
  });
});