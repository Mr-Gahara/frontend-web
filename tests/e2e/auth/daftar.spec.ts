import { test, expect, type Page } from "@playwright/test";
import { AKUN_UJI } from "../../helpers/masuk-uji";
import { ALASAN_TANPA_ADMIN, hapusAkunKlienUji, idAkunLewatEmail, kredensialAdmin } from "../../helpers/admin-uji";
import { ALASAN_TANPA_MAILPIT, ambilOtp, mailpitMenyala } from "../../helpers/mailpit-uji";
import { tempelKode } from "../../helpers/kode-uji";

/*
 * Halaman daftar desain E (modul/setup-akun.md). Register selalu menjawab
 * 201 dengan email tersamar (B231), jadi email terdaftar tidak lagi
 * dibedakan, dan pendaftar baru memasukkan OTP dari email (B232) yang
 * dibaca dari Mailpit (UJ1a). registerLimiter di backend development
 * dibatasi 10 per 15 menit per IP kecuali dilonggarkan lewat
 * REGISTER_LIMIT_MAX (B230); spec ini mengirim tiga pendaftaran per run, dan
 * akun barunya dihapus lewat API admin (dibekukan dulu, karena backend
 * hanya menghapus akun non-aktif).
 */
const POLA_DAFTAR = /\/api\/akun\/auth\/register$/;
const PASSWORD_BARU = "Daftar1234";
/** registerLimiter backend development tetap aktif; 429 berarti kuota jendela 15 menit habis, bukan kegagalan halaman. */
const ALASAN_KUOTA =
  "Kuota registerLimiter backend habis (429); jalankan backend dengan REGISTER_LIMIT_MAX lebih besar (B230), atau ulang setelah 15 menit";
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

  test("email yang sudah terdaftar tidak dibocorkan: tetap lanjut ke isian kode", async ({ page }) => {
    const jawab = page.waitForResponse(POLA_DAFTAR);
    await isiForm(page, AKUN_UJI.email, PASSWORD_BARU);
    const res = await jawab;
    test.skip(res.status() === 429, ALASAN_KUOTA);
    expect(res.status()).toBe(201);
    const isi = await res.json();
    expect(isi.data?.id, "respons register tanpa id (B231)").toBeUndefined();
    expect(isi.data?.email, "email tersamar (B231)").not.toBe(AKUN_UJI.email);

    await page.waitForURL(/\/daftar\/verifikasi\?email=/);
    await expect(page.getByRole("heading", { level: 1, name: "Cek email Anda" })).toBeVisible();
    await expect(page.getByText(AKUN_UJI.email)).toBeVisible();
    await expect(page.getByText(/sudah terdaftar/i)).toHaveCount(0);
  });

  test("pendaftaran berhasil: kode dari email memverifikasi lalu masuk ke wizard setup", async ({ page }) => {
    const admin = kredensialAdmin();
    test.skip(!admin, ALASAN_TANPA_ADMIN);
    test.skip(!(await mailpitMenyala()), ALASAN_TANPA_MAILPIT);
    const email = `e2e-daftar-${Date.now()}@contoh.test`;
    let terkirim = false;
    try {
      const sejak = new Date();
      const jawab = page.waitForResponse(POLA_DAFTAR);
      await isiForm(page, email, PASSWORD_BARU);
      const res = await jawab;
      test.skip(res.status() === 429, ALASAN_KUOTA);
      expect(res.status()).toBe(201);
      terkirim = true;

      await page.waitForURL(/\/daftar\/verifikasi\?email=/);
      await expect(langkahAktif(page)).toContainText("Verifikasi email");
      await expect(page.getByLabel("Password akun"), "password titipan ada, isian password tidak tampil").toHaveCount(0);
      const kode = await ambilOtp(email, sejak);

      const verifikasi = page.waitForResponse(/\/api\/akun\/auth\/verifikasi-email$/);
      const login = page.waitForResponse(/\/api\/akun\/auth\/login$/);
      await tempelKode(page.getByLabel("Digit 1 dari 6"), kode);
      await page.getByRole("button", { name: "Verifikasi dan masuk" }).click();
      const resVerifikasi = await verifikasi;
      expect(resVerifikasi.status()).toBe(200);
      expect(resVerifikasi.request().postDataJSON(), "password titipan daftar ikut dikirim (B248)").toEqual({
        email,
        otp: kode,
        password: PASSWORD_BARU,
      });
      const masuk = await login;
      expect(masuk.status()).toBe(200);
      expect((await masuk.json()).requireSetup, "akun baru belum selesai setup (B223)").toBe(true);
      await page.waitForURL("**/setup");
    } finally {
      if (terkirim && admin) {
        const id = await idAkunLewatEmail(email, admin);
        expect.soft(id, "akun pendaftar ditemukan untuk dibersihkan").not.toBe("");
        if (id) await hapusAkunKlienUji(id, admin);
      }
    }
  });

  test("login sebelum verifikasi diarahkan ke isian kode; kode salah diulang, lalu kode baru memverifikasi", async ({
    page,
  }) => {
    const admin = kredensialAdmin();
    test.skip(!admin, ALASAN_TANPA_ADMIN);
    test.skip(!(await mailpitMenyala()), ALASAN_TANPA_MAILPIT);
    const email = `e2e-belum-verif-${Date.now()}@contoh.test`;
    let terkirim = false;
    try {
      const daftar = await page.request.post("/api/akun/auth/register", { data: { email, password: PASSWORD_BARU } });
      test.skip(daftar.status() === 429, ALASAN_KUOTA);
      expect(daftar.status()).toBe(201);
      terkirim = true;

      await page.goto("/login");
      const sejak = new Date();
      const login = page.waitForResponse(/\/api\/akun\/auth\/login$/);
      const kirimUlang = page.waitForResponse(/\/api\/akun\/auth\/verifikasi-email\/kirim$/);
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password", { exact: true }).fill(PASSWORD_BARU);
      await page.getByRole("button", { name: "Masuk" }).click();
      const tolak = await login;
      expect(tolak.status()).toBe(403);
      expect((await tolak.json()).code).toBe("EMAIL_BELUM_TERVERIFIKASI");
      expect((await kirimUlang).status()).toBe(200);
      await page.waitForURL(/\/daftar\/verifikasi\?email=/);

      const kode = await ambilOtp(email, sejak);
      // Kode salah lebih dulu: password titipan login tidak boleh hilang,
      // agar kode yang benar sesudahnya tetap membawanya (B248).
      const salah = kode === "000000" ? "111111" : "000000";
      const tSalah = page.waitForResponse(/\/api\/akun\/auth\/verifikasi-email$/);
      await tempelKode(page.getByLabel("Digit 1 dari 6"), salah);
      await page.getByRole("button", { name: "Verifikasi dan masuk" }).click();
      const resSalah = await tSalah;
      expect(resSalah.status(), "kode salah ditolak").toBe(400);
      expect(resSalah.request().postDataJSON()).toEqual({ email, otp: salah, password: PASSWORD_BARU });
      await expect(page.getByRole("alert").filter({ hasText: "Kode OTP salah atau sudah kedaluwarsa." })).toBeVisible();
      await expect(page).toHaveURL(/\/daftar\/verifikasi/);

      const tBenar = page.waitForResponse(/\/api\/akun\/auth\/verifikasi-email$/);
      await tempelKode(page.getByLabel("Digit 1 dari 6"), kode);
      await page.getByRole("button", { name: "Verifikasi dan masuk" }).click();
      const resBenar = await tBenar;
      expect(resBenar.status()).toBe(200);
      expect(resBenar.request().postDataJSON(), "password titipan login masih ada").toEqual({
        email,
        otp: kode,
        password: PASSWORD_BARU,
      });
      await page.waitForURL("**/setup");
    } finally {
      if (terkirim && admin) {
        const id = await idAkunLewatEmail(email, admin);
        if (id) await hapusAkunKlienUji(id, admin);
      }
    }
  });

  test("tanpa password titipan: password akun diisi di halaman verifikasi, tetap terisi saat kode salah, lalu kode benar memverifikasi dan masuk (B248)", async ({
    page,
  }) => {
    // Halaman verifikasi dibuka langsung, sama seperti setelah dimuat ulang:
    // password titipan daftar tidak ada di memori. Password yang diisi di
    // halaman ini menjadi password akun (A-01), jadi sengaja berbeda dari
    // password saat daftar (opsi A, pemilik proyek 12 November 2026).
    const admin = kredensialAdmin();
    test.skip(!admin, ALASAN_TANPA_ADMIN);
    test.skip(!(await mailpitMenyala()), ALASAN_TANPA_MAILPIT);
    const email = `e2e-tanpa-titipan-${Date.now()}@contoh.test`;
    const passwordAkun = "Ganti5678";
    let terkirim = false;
    try {
      const sejak = new Date();
      const daftar = await page.request.post("/api/akun/auth/register", { data: { email, password: PASSWORD_BARU } });
      test.skip(daftar.status() === 429, ALASAN_KUOTA);
      expect(daftar.status()).toBe(201);
      terkirim = true;
      const kode = await ambilOtp(email, sejak);

      await page.goto("/daftar/verifikasi?email=" + encodeURIComponent(email));
      const isian = page.getByLabel("Password akun");
      const ulangi = page.getByLabel("Ulangi password");
      await expect(isian).toBeVisible();
      await expect(page.getByText("Dipakai untuk masuk ke akun toko. Minimal 8 karakter, dengan huruf kapital dan angka.")).toBeVisible();
      await isian.fill(passwordAkun);
      await ulangi.fill(passwordAkun);

      const salah = kode === "000000" ? "111111" : "000000";
      const tSalah = page.waitForResponse(/\/api\/akun\/auth\/verifikasi-email$/);
      await tempelKode(page.getByLabel("Digit 1 dari 6"), salah);
      await page.getByRole("button", { name: "Verifikasi dan masuk" }).click();
      const resSalah = await tSalah;
      expect(resSalah.status(), "kode salah ditolak").toBe(400);
      expect(resSalah.request().postDataJSON()).toEqual({ email, otp: salah, password: passwordAkun });
      await expect(page.getByRole("alert").filter({ hasText: "Kode OTP salah atau sudah kedaluwarsa." })).toBeVisible();
      await expect(isian, "password tidak dikosongkan saat kode salah").toHaveValue(passwordAkun);
      await expect(ulangi).toHaveValue(passwordAkun);

      const tBenar = page.waitForResponse(/\/api\/akun\/auth\/verifikasi-email$/);
      const login = page.waitForResponse(/\/api\/akun\/auth\/login$/);
      await tempelKode(page.getByLabel("Digit 1 dari 6"), kode);
      await page.getByRole("button", { name: "Verifikasi dan masuk" }).click();
      const resBenar = await tBenar;
      expect(resBenar.status()).toBe(200);
      expect(resBenar.request().postDataJSON()).toEqual({ email, otp: kode, password: passwordAkun });
      const masuk = await login;
      expect(masuk.status(), "password isian menjadi password akun (A-01)").toBe(200);
      expect(masuk.request().postDataJSON()).toEqual({ email, password: passwordAkun });
      await page.waitForURL("**/setup");
    } finally {
      if (terkirim && admin) {
        const id = await idAkunLewatEmail(email, admin);
        expect.soft(id, "akun pendaftar ditemukan untuk dibersihkan").not.toBe("");
        if (id) await hapusAkunKlienUji(id, admin);
      }
    }
  });
});
