import { test, expect, type Page } from "@playwright/test";
import { tempelKode } from "../../helpers/kode-uji";
import { ALASAN_TANPA_MAILPIT, ambilOtp, mailpitMenyala } from "../../helpers/mailpit-uji";
import {
  ALASAN_TANPA_ADMIN,
  PASSWORD_AKUN_UJI,
  buatAkunKlienUji,
  hapusAkunKlienUji,
  kredensialAdmin,
} from "../../helpers/admin-uji";

/*
 * Verifikasi email (/daftar/verifikasi, B232) dan lupa password
 * (/lupa-password, B217), desain F. Alur berhasil verifikasi email ada di
 * spec daftar, termasuk kode salah dengan password di memori (B248); di sini
 * kotak kode, validasi klien, halaman tanpa password di memori, dan lupa
 * password sampai login dengan password baru. Kode dibaca dari
 * Mailpit (UJ1a). Kedua endpoint menjawab seragam untuk email terdaftar
 * maupun tidak, jadi alamat acak cukup untuk jalur kode salah.
 */
const OTP_SALAH = "Kode OTP salah atau sudah kedaluwarsa.";
const alamatAcak = (awalan: string) => `e2e-${awalan}-${Date.now()}@contoh.test`;

function catatPermintaan(page: Page) {
  const kirim: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/") && r.method() !== "GET" && !/refreshtoken|pin-refresh/.test(r.url())) {
      kirim.push(r.url().replace(/^.*\/api/, ""));
    }
  });
  return kirim;
}

test.describe("Verifikasi email", () => {
  test("email, stepper langkah 2, dan kirim ulang yang menunggu hitung mundur", async ({ page }) => {
    await page.goto("/daftar/verifikasi?email=pemilik@kopisenja.id");
    await expect(page.getByRole("heading", { level: 1, name: "Cek email Anda" })).toBeVisible();
    await expect(page.getByText("pemilik@kopisenja.id")).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Langkah pendaftaran" }).locator('[aria-current="step"]'),
    ).toContainText("Verifikasi email");
    await expect(page.getByRole("button", { name: /Kirim ulang dalam (1:00|0:5\d)/ })).toBeDisabled();
  });

  test("kotak kode: maju otomatis, Backspace mundur, dan tempel mengisi semua", async ({ page }) => {
    await page.goto("/daftar/verifikasi");
    await page.getByLabel("Digit 1 dari 6").pressSequentially("4");
    await expect(page.getByLabel("Digit 2 dari 6")).toBeFocused();
    await page.keyboard.press("Backspace");
    await expect(page.getByLabel("Digit 1 dari 6")).toBeFocused();
    await expect(page.getByLabel("Digit 1 dari 6")).toHaveValue("");

    await tempelKode(page.getByLabel("Digit 1 dari 6"), "60-42 18");
    for (const [i, d] of ["6", "0", "4", "2", "1", "8"].entries()) {
      await expect(page.getByLabel(`Digit ${i + 1} dari 6`)).toHaveValue(d);
    }
  });

  test("kode belum lengkap ditahan klien; tanpa password di memori kode tidak dikirim dan halaman pindah ke login (B248)", async ({
    page,
  }) => {
    // Halaman dibuka langsung, jadi tidak ada password titipan daftar atau
    // login. Sejak B248 verifikasi tanpa password pasti dijawab 400, sehingga
    // kode tidak dikirim (pemilik proyek, 6 November 2026). Kode salah dengan
    // password di memori diuji lewat alur login di spec daftar.
    const kirim = catatPermintaan(page);
    const email = alamatAcak("verifikasi");
    await page.goto("/daftar/verifikasi?email=" + encodeURIComponent(email));
    await page.getByRole("button", { name: "Verifikasi email" }).click();
    await expect(page.getByText("Masukkan 6 digit kode verifikasi.")).toBeVisible();
    expect(kirim).toEqual([]);

    await tempelKode(page.getByLabel("Digit 1 dari 6"), "000000");
    await page.getByRole("button", { name: "Verifikasi email" }).click();
    await page.waitForURL(/\/login$/);
    await expect(page.getByText("Masuk lagi", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Masuk dengan email dan password akun Anda untuk menerima kode verifikasi baru."),
    ).toBeVisible();
    expect(kirim, "tidak ada permintaan verifikasi tanpa password").toEqual([]);
  });
});

test.describe("Lupa password", () => {
  test("validasi klien, lalu email tak terdaftar tetap ke isian kode dan kode salah ditolak", async ({ page }) => {
    const kirim = catatPermintaan(page);
    const email = alamatAcak("lupa");
    await page.goto("/lupa-password");
    await expect(page.getByRole("heading", { level: 1, name: "Atur ulang password akun toko." })).toBeVisible();

    await page.getByRole("button", { name: "Kirim kode" }).click();
    await expect(page.getByText("Email wajib diisi")).toBeVisible();
    expect(kirim).toEqual([]);
    await page.getByLabel("Email").fill(email);
    const minta = page.waitForResponse(/\/api\/akun\/auth\/lupa-password$/);
    await page.getByRole("button", { name: "Kirim kode" }).click();
    expect((await minta).status(), "jawaban seragam walau email tak terdaftar (B217)").toBe(200);

    await expect(page.getByRole("heading", { name: "Buat password baru" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page.getByText("Masukkan 6 digit kode verifikasi.")).toBeVisible();
    await expect(page.getByText("Password wajib diisi", { exact: true })).toBeVisible();

    await tempelKode(page.getByLabel("Digit 1 dari 6"), "604218");
    await page.getByLabel("Password baru", { exact: true }).fill("abcdefgh");
    await page.getByLabel("Ulangi password baru").fill("abcdefgh");
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page.getByText("Password harus mengandung minimal 1 huruf kapital")).toBeVisible();

    await page.getByLabel("Password baru", { exact: true }).fill("Senja2026");
    await page.getByLabel("Ulangi password baru").fill("Senja2027");
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    await expect(page.getByText("Password tidak sama")).toBeVisible();
    expect(kirim).toEqual(["/akun/auth/lupa-password"]);

    await page.getByLabel("Ulangi password baru").fill("Senja2026");
    const atur = page.waitForResponse(/\/api\/akun\/auth\/reset-password$/);
    await page.getByRole("button", { name: "Simpan password baru" }).click();
    expect((await atur).status()).toBe(400);
    await expect(page.getByRole("alert").filter({ hasText: OTP_SALAH })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Buat password baru" })).toBeVisible();
  });

  test("kode dari email mengganti password, lalu login dengan password baru", async ({ page }) => {
    const admin = kredensialAdmin();
    test.skip(!admin, ALASAN_TANPA_ADMIN);
    test.skip(!(await mailpitMenyala()), ALASAN_TANPA_MAILPIT);
    const email = alamatAcak("reset");
    const passwordBaru = "Reset2026Baru";
    let id = "";
    try {
      id = await buatAkunKlienUji(email, admin!);
      await page.goto("/login");
      await page.getByRole("link", { name: "Lupa password?" }).click();
      await page.waitForURL("**/lupa-password");

      const sejak = new Date();
      await page.getByLabel("Email").fill(email);
      await page.getByRole("button", { name: "Kirim kode" }).click();
      await expect(page.getByRole("heading", { name: "Buat password baru" })).toBeVisible();
      const kode = await ambilOtp(email, sejak);

      await tempelKode(page.getByLabel("Digit 1 dari 6"), kode);
      await page.getByLabel("Password baru", { exact: true }).fill(passwordBaru);
      await page.getByLabel("Ulangi password baru").fill(passwordBaru);
      const atur = page.waitForResponse(/\/api\/akun\/auth\/reset-password$/);
      await page.getByRole("button", { name: "Simpan password baru" }).click();
      expect((await atur).status()).toBe(200);
      await expect(page.getByRole("heading", { name: "Password diganti" })).toBeVisible();

      const lama = await page.request.post("/api/akun/auth/login", { data: { email, password: PASSWORD_AKUN_UJI } });
      expect(lama.status(), "password lama tidak berlaku").toBe(401);
      const baru = await page.request.post("/api/akun/auth/login", { data: { email, password: passwordBaru } });
      expect(baru.status(), "password baru berlaku").toBe(200);
    } finally {
      if (id && admin) await hapusAkunKlienUji(id, admin);
    }
  });

  test("Ganti email kembali ke tahap email dengan isian sebelumnya", async ({ page }) => {
    await page.goto("/lupa-password");
    await page.getByLabel("Email").fill("pemilik@kopisenja.id");
    await page.getByRole("button", { name: "Kirim kode" }).click();
    await page.getByRole("button", { name: "Ganti email" }).click();
    await expect(page.getByLabel("Email")).toHaveValue("pemilik@kopisenja.id");
  });
});
