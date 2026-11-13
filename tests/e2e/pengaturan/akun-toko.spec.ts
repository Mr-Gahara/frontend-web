import { test, expect, type Page } from "@playwright/test";
import { masuk } from "../../helpers/masuk-uji";
import { masukBacaSaja } from "../../helpers/terkunci-uji";
import { tanpaGulirDiSemuaLebar } from "../../helpers/tata-letak-uji";

/*
 * Halaman Akun Toko di Pengaturan (OA8a) tanpa mengirim kode: kartu
 * Pengaturan, email dari GET /akun/me, tahap 1 kedua dialog dengan validasi
 * klien, tata letak 390, 768, dan 1280 px, serta penolakan bagi bukan Owner.
 * Akun uji bersama tidak pernah diubah di sini; alur ber-OTP ada di
 * akun-toko-otp.spec.ts pada akun klien sekali pakai.
 */
const URL_AKUN = "/dashboard/outlet/pengaturan/akun";

function catatOtp(page: Page) {
  const kirim: string[] = [];
  page.on("request", (r) => {
    if (/\/api\/akun\/profil/.test(r.url()) && r.method() !== "GET") kirim.push(`${r.method()} ${r.url()}`);
  });
  return kirim;
}

test("Owner membuka Akun Toko dari Pengaturan; tahap 1 kedua dialog memeriksa isian tanpa mengirim kode", async ({
  page,
}) => {
  const otp = catatOtp(page);
  await masuk(page);
  await page.goto("/dashboard/outlet/pengaturan");
  const akunSaya = page.waitForResponse((r) => /\/api\/akun\/me(\?|$)/.test(r.url()) && r.status() === 200);
  await page.getByRole("link", { name: /Akun Toko/ }).click();
  await page.waitForURL("**" + URL_AKUN);
  const email = ((await (await akunSaya).json()).data as { email: string }).email;

  await expect(page.getByRole("heading", { level: 1, name: "Akun Toko" })).toBeVisible();
  const kartu = page.getByRole("region", { name: "Email dan Password" });
  await expect(kartu.getByText(email, { exact: true })).toBeVisible();
  await tanpaGulirDiSemuaLebar(page, "halaman Akun Toko");

  // Ubah email tahap 1: email yang sama ditolak klien.
  await kartu.getByRole("button", { name: "Ubah email" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Tahap 1 dari 2")).toBeVisible();
  await expect(dialog.getByLabel("Email saat ini")).toHaveValue(email);
  await dialog.getByLabel("Email baru").fill(email.toUpperCase());
  await dialog.getByRole("button", { name: "Kirim kode" }).click();
  await expect(dialog.getByText("Email baru sama dengan email saat ini")).toBeVisible();
  await tanpaGulirDiSemuaLebar(page, "dialog ubah email");
  await dialog.getByRole("button", { name: "Batal" }).click();
  await expect(dialog).toBeHidden();

  // Ubah password tahap 1: aturan password baru dan ulangi.
  await kartu.getByRole("button", { name: "Ubah password" }).click();
  await expect(dialog.getByRole("heading", { name: "Ubah password akun" })).toBeVisible();
  await dialog.getByLabel("Password baru", { exact: true }).fill("abcdefgh");
  await dialog.getByLabel("Ulangi password baru").fill("abcdefgi");
  await dialog.getByRole("button", { name: "Kirim kode" }).click();
  await expect(dialog.getByText("Password lama wajib diisi")).toBeVisible();
  await expect(dialog.getByText("Password harus mengandung minimal 1 huruf kapital")).toBeVisible();
  await expect(dialog.getByText("Password tidak sama")).toBeVisible();
  await tanpaGulirDiSemuaLebar(page, "dialog ubah password");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  expect(otp, "tidak ada kode maupun perubahan akun yang dikirim").toEqual([]);
});

test("bukan Owner tanpa update-akun tidak melihat kartu Akun Toko dan ditolak di halamannya", async ({ page }) => {
  await masuk(page);
  await masukBacaSaja(page);
  await page.goto("/dashboard/outlet/pengaturan");
  await expect(page.getByRole("heading", { name: "Pengaturan Outlet" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Akun Toko/ })).toHaveCount(0);
  await page.goto(URL_AKUN);
  await expect(page.getByRole("heading", { name: "Akses ditolak" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Akun Toko" })).toHaveCount(0);
});
