import { test, expect, type Page } from "@playwright/test";
import { AKUN_UJI } from "../../helpers/masuk-uji";
import { ALASAN_TANPA_ADMIN, hapusAkunKlienUji, kredensialAdmin } from "../../helpers/admin-uji";

/*
 * Halaman daftar desain E (modul/setup-akun.md). Belum ditautkan dari login
 * akun sampai OTP daftar (N3) dan wizard setup (Y1) tersedia. registerLimiter
 * tetap aktif di backend development (10 pendaftaran per 15 menit per IP),
 * jadi spec ini hanya mengirim dua pendaftaran per run: satu ditolak 409,
 * satu berhasil lalu akunnya dihapus lewat API admin (dibekukan dulu, karena
 * backend hanya menghapus akun non-aktif).
 */
const POLA_DAFTAR = /\/api\/akun\/auth\/register$/;
const PASSWORD_BARU = "Daftar1234";
const langkahAktif = (page: Page) =>
  page.getByRole("list", { name: "Langkah pendaftaran" }).locator('[aria-current="step"]');

async function isiForm(page: Page, email: string, password: string, ulangi = password) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Ulangi password").fill(ulangi);
  await page.getByRole("button", { name: "Daftar", exact: true }).click();
}

test.describe("Halaman daftar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/daftar");
  });

  test("judul, stepper di langkah 1, dan tautan masuk", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Buat akun toko" })).toBeVisible();
    await expect(langkahAktif(page)).toContainText("Daftar akun");
    await expect(page.getByRole("link", { name: "Masuk" })).toHaveAttribute("href", "/login");
  });

  test("carousel plan berputar maju dan mundur, dengan fitur sesuai plan", async ({ page }) => {
    const judul = page.getByRole("heading", { level: 2 });
    const tidakTermasuk = page.getByRole("img", { name: "Tidak termasuk" });
    await expect(judul).toHaveText("Plan Basic");
    await expect(tidakTermasuk).toHaveCount(2);

    await page.getByRole("button", { name: "Plan berikutnya" }).click();
    await expect(judul).toHaveText("Plan Advanced");
    await expect(tidakTermasuk).toHaveCount(1);

    await page.getByRole("button", { name: "Plan berikutnya" }).click();
    await expect(judul).toHaveText("Plan Pro");
    await expect(tidakTermasuk).toHaveCount(0);

    await page.getByRole("button", { name: "Plan berikutnya" }).click();
    await expect(judul).toHaveText("Plan Basic");

    await page.getByRole("button", { name: "Plan sebelumnya" }).click();
    await expect(judul).toHaveText("Plan Pro");

    await page.getByRole("button", { name: "Tampilkan plan Advanced" }).click();
    await expect(judul).toHaveText("Plan Advanced");
    await expect(page.getByRole("button", { name: "Tampilkan plan Advanced" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("validasi form tanpa mengirim permintaan", async ({ page }) => {
    let jumlah = 0;
    page.on("request", (r) => {
      if (POLA_DAFTAR.test(r.url())) jumlah++;
    });

    await page.getByRole("button", { name: "Daftar", exact: true }).click();
    await expect(page.getByText("Email wajib diisi", { exact: true })).toBeVisible();
    await expect(page.getByText("Password wajib diisi", { exact: true })).toBeVisible();
    await expect(page.getByText("Ulangi password wajib diisi", { exact: true })).toBeVisible();

    await isiForm(page, "baru@contoh.test", "abcdefgh");
    await expect(page.getByText("Password harus mengandung minimal 1 huruf kapital", { exact: true })).toBeVisible();

    await isiForm(page, "baru@contoh.test", "Abcdefgh");
    await expect(page.getByText("Password harus mengandung minimal 1 angka", { exact: true })).toBeVisible();

    await isiForm(page, "baru@contoh.test", PASSWORD_BARU, "Daftar12345");
    await expect(page.getByText("Password tidak sama", { exact: true })).toBeVisible();

    expect(jumlah).toBe(0);
  });

  test("email yang sudah terdaftar ditolak dengan pesan backend", async ({ page }) => {
    const jawab = page.waitForResponse(POLA_DAFTAR);
    await isiForm(page, AKUN_UJI.email, PASSWORD_BARU);
    expect((await jawab).status()).toBe(409);
    await expect(page.getByText("Email sudah terdaftar.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Buat akun toko" })).toBeVisible();
  });

  test("pendaftaran berhasil memindahkan stepper ke verifikasi email", async ({ page }) => {
    const admin = kredensialAdmin();
    test.skip(!admin, ALASAN_TANPA_ADMIN);
    const email = `e2e-daftar-${Date.now()}@contoh.test`;
    let id = "";
    try {
      const jawab = page.waitForResponse(POLA_DAFTAR);
      await isiForm(page, email, PASSWORD_BARU);
      const res = await jawab;
      const isi = await res.json();
      id = String(isi.data?._id ?? isi.data?.id ?? "");
      expect(res.status(), JSON.stringify(isi).slice(0, 200)).toBe(201);

      await expect(page.getByRole("heading", { level: 1, name: "Akun dibuat" })).toBeVisible();
      await expect(page.getByText(email)).toBeVisible();
      await expect(langkahAktif(page)).toContainText("Verifikasi email");
      await expect(page.getByRole("link", { name: "Kembali ke halaman masuk" })).toHaveAttribute("href", "/login");
    } finally {
      if (id && admin) await hapusAkunKlienUji(id, admin);
    }
  });
});