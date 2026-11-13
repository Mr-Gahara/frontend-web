import { test, expect } from "@playwright/test";
import { masukAkun } from "../../helpers/masuk-uji";
import { tanpaGulirDiSemuaLebar } from "../../helpers/tata-letak-uji";

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
  test("judul, nama toko dan email akun, tombol masuk, dan tombol keluar tampil", async ({ page }) => {
    // Pasang penunggu sebelum login akun, karena panel memintanya begitu halaman terbuka.
    const akunSaya = page.waitForResponse((r) => /\/api\/akun\/me(\?|$)/.test(r.url()));
    await masukAkun(page);
    const res = await akunSaya;
    expect(res.status(), "GET /akun/me").toBe(200);
    const data = (await res.json()).data as { email: string; daftarTenant: { namaToko: string }[] };
    await expect(page.getByRole("heading", { level: 1, name: "Siapa yang bertugas?" })).toBeVisible();
    await expect(page.getByText(data.daftarTenant[0].namaToko, { exact: true })).toBeVisible();
    await expect(page.getByText(data.email, { exact: true })).toBeVisible();
    await expect(page.getByText("Tachyon POS")).toBeHidden();
    await expect(page.getByRole("button", { name: "Masuk ke kasir" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Keluar dari akun toko" })).toBeVisible();
  });

  test("panel kembali ke merek bila akun gagal dimuat", async ({ page }) => {
    await page.route(/\/api\/akun\/me(\?|$)/, (route) =>
      route.fulfill({ status: 500, json: { status: "error", message: "Gagal" } }),
    );
    await masukAkun(page);
    await expect(page.getByRole("heading", { level: 1, name: "Siapa yang bertugas?" })).toBeVisible();
    await expect(page.getByText("Tachyon POS")).toBeVisible();
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

  // OA1a: tahap 1 saja, tanpa mengirim kode, sehingga aman bagi akun uji bersama.
  test("Lupa PIN? menautkan Owner ke atur ulang PIN tahap 1 tanpa meluber, lalu kembali", async ({ page }) => {
    const kirimKode: string[] = [];
    page.on("request", (r) => {
      if (/\/api\/pengguna\/reset-pin-owner/.test(r.url())) kirimKode.push(r.url());
    });
    const akunSaya = page.waitForResponse((r) => /\/api\/akun\/me(\?|$)/.test(r.url()));
    await masukAkun(page);
    const email = ((await (await akunSaya).json()).data as { email: string }).email;

    await page.getByRole("button", { name: "Lupa PIN?" }).click();
    await page.getByRole("link", { name: "Atur ulang PIN Owner" }).click();
    await page.waitForURL("**/lupa-pin");
    await expect(page.getByRole("heading", { level: 1, name: "Atur ulang PIN Owner" })).toBeVisible();
    await expect(page.getByText("Tahap 1 dari 2")).toBeVisible();
    await expect(page.getByText(`Kode dikirim ke ${email}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Kirim kode" })).toBeEnabled();
    await tanpaGulirDiSemuaLebar(page, "atur ulang PIN tahap 1");

    await page.getByRole("link", { name: "Kembali ke masuk kasir" }).click();
    await page.waitForURL("**/login/pengguna");
    await expect(page.getByRole("heading", { level: 1, name: "Siapa yang bertugas?" })).toBeVisible();

    // Owner yang dialihkan wizard (?kembali=/setup) tidak kehilangan jalan kembali ke wizard.
    await page.goto("/login/pengguna?kembali=/setup");
    await page.getByRole("button", { name: "Lupa PIN?" }).click();
    await page.getByRole("link", { name: "Atur ulang PIN Owner" }).click();
    await page.waitForURL(/\/lupa-pin\?kembali=%2Fsetup$/);
    await page.getByRole("link", { name: "Kembali ke masuk kasir" }).click();
    await page.waitForURL(/\/login\/pengguna\?kembali=%2Fsetup$/);
    expect(kirimKode, "tidak ada kode yang diminta").toEqual([]);
  });
});