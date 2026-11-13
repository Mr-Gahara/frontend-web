import { test, expect, type Page } from "@playwright/test";
import { tempelKode } from "../../helpers/kode-uji";
import { ALASAN_TANPA_MAILPIT, ambilOtp, mailpitMenyala } from "../../helpers/mailpit-uji";
import {
  ALASAN_TANPA_ADMIN,
  PASSWORD_AKUN_UJI,
  hapusAkunKlienUji,
  kredensialAdmin,
  wajibAdmin,
} from "../../helpers/admin-uji";
import { isiLoginAkun } from "../../helpers/masuk-uji";
import { akunBaru, isiTokoDanOwner } from "../../helpers/setup-uji";

/*
 * Ubah email dan password akun lewat kode (OA3a, OA11a, OA12a; B179, B180)
 * pada akun klien sekali pakai (toko dan Owner lewat wizard), karena
 * keduanya benar-benar mengubah kredensial. Pemakaian OTP per run: 2 kirim
 * dan 2 periksa kode, karena password lama dan PIN diperiksa backend sebelum
 * kode (inti/pengujian.md). Hanya dijalankan di suite penuh
 * akhir putaran.
 */
const URL_AKUN = "/dashboard/outlet/pengaturan/akun";
const PASSWORD_BARU = "GantiSandi2026";

const tungguKirim = (page: Page) =>
  page.waitForResponse((r) => r.request().method() === "POST" && /\/api\/akun\/profil\/otp$/.test(r.url()));
const tungguUbah = (page: Page) =>
  page.waitForResponse((r) => r.request().method() === "PUT" && /\/api\/akun\/profil\/update\//.test(r.url()));

test("Owner mengubah email, lalu password (salah password lama dulu), dan masuk lagi dengan password baru", async ({
  page,
}) => {
  const admin = kredensialAdmin();
  test.skip(!admin, ALASAN_TANPA_ADMIN);
  test.skip(!(await mailpitMenyala()), ALASAN_TANPA_MAILPIT);
  test.setTimeout(150_000);
  const { id, email } = await akunBaru(page, "akuntoko");
  const emailBaru = email.replace("e2e.setup.", "e2e.setup.baru.");
  try {
    await isiTokoDanOwner(page);
    await page.goto(URL_AKUN);
    const kartu = page.getByRole("region", { name: "Email dan Password" });
    await expect(kartu.getByText(email, { exact: true })).toBeVisible({ timeout: 15_000 });
    const dialog = page.getByRole("dialog");

    // Ubah email: kode dikirim ke email lama.
    await kartu.getByRole("button", { name: "Ubah email" }).click();
    await dialog.getByLabel("Email baru").fill(emailBaru);
    let sejak = new Date();
    const kirim1 = tungguKirim(page);
    await dialog.getByRole("button", { name: "Kirim kode" }).click();
    expect((await kirim1).request().postDataJSON()).toEqual({ tujuan: "ubah-profil" });
    await expect(dialog.getByText("Tahap 2 dari 2")).toBeVisible();
    await tempelKode(dialog.getByLabel("Digit 1 dari 6"), await ambilOtp(email, sejak));
    const ubah1 = tungguUbah(page);
    await dialog.getByRole("button", { name: "Simpan email" }).click();
    expect((await ubah1).status(), "PUT ubah email").toBe(200);
    await expect(page.getByText(`Email akun diubah menjadi ${emailBaru}.`)).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(kartu.getByText(emailBaru, { exact: true })).toBeVisible();

    // Ubah password: password lama salah ditolak di tahap 2, kode tetap dipakai (OA11a).
    await kartu.getByRole("button", { name: "Ubah password" }).click();
    await dialog.getByLabel("Password lama").fill("SalahLama123");
    await dialog.getByLabel("Password baru", { exact: true }).fill(PASSWORD_BARU);
    await dialog.getByLabel("Ulangi password baru").fill(PASSWORD_BARU);
    sejak = new Date();
    const kirim2 = tungguKirim(page);
    await dialog.getByRole("button", { name: "Kirim kode" }).click();
    expect((await kirim2).status()).toBe(200);
    const kode = await ambilOtp(emailBaru, sejak);
    await tempelKode(dialog.getByLabel("Digit 1 dari 6"), kode);
    const ubah2 = tungguUbah(page);
    await dialog.getByRole("button", { name: "Simpan password" }).click();
    expect((await ubah2).status(), "password lama salah").toBe(400);
    await expect(dialog.getByRole("alert")).toContainText("Password lama tidak sesuai.");

    await dialog.getByRole("button", { name: "Kembali" }).click();
    await expect(dialog.getByLabel("Password baru", { exact: true })).toHaveValue(PASSWORD_BARU);
    await dialog.getByLabel("Password lama").fill(PASSWORD_AKUN_UJI);
    const tanpaKirim: string[] = [];
    page.on("request", (r) => {
      if (/\/api\/akun\/profil\/otp$/.test(r.url())) tanpaKirim.push(r.url());
    });
    await dialog.getByRole("button", { name: "Lanjut dengan kode yang sama" }).click();
    await expect(dialog.getByLabel("Digit 6 dari 6")).toHaveValue(kode.at(-1)!);
    const ubah3 = tungguUbah(page);
    await dialog.getByRole("button", { name: "Simpan password" }).click();
    const simpan = await ubah3;
    expect(simpan.status(), "PUT ubah password").toBe(200);
    expect(simpan.request().postDataJSON()).toEqual({ oldPassword: PASSWORD_AKUN_UJI, password: PASSWORD_BARU, otp: kode });
    expect(tanpaKirim, "kode yang sama dipakai tanpa meminta kode baru").toEqual([]);

    // Sesi akun dicabut: kembali ke login akun dengan toast, lalu masuk dengan password baru.
    await page.waitForURL(/\/login$/);
    await expect(page.getByText("Password akun diubah")).toBeVisible();
    await isiLoginAkun(page, emailBaru, PASSWORD_BARU);
    await page.waitForURL(/\/(setup|login\/pengguna)/);
  } finally {
    await hapusAkunKlienUji(id, wajibAdmin());
  }
});

// OA5a, OA10a, OA11a, OA12a (B180, B181). Pemakaian OTP: 1 kirim dan 1 periksa kode (PIN salah ditolak sebelum kode).
test("Owner menghapus akun beserta data toko: PIN salah ditolak di langkah 2, lalu terhapus", async ({ page }) => {
  const admin = kredensialAdmin();
  test.skip(!admin, ALASAN_TANPA_ADMIN);
  test.skip(!(await mailpitMenyala()), ALASAN_TANPA_MAILPIT);
  test.setTimeout(150_000);
  const { id, email } = await akunBaru(page, "hapusakun");
  let terhapus = false;
  try {
    await isiTokoDanOwner(page);
    await page.goto(URL_AKUN);
    const zona = page.getByRole("region", { name: "Zona Bahaya" });
    await zona.getByRole("button", { name: "Hapus akun" }).click({ timeout: 15_000 });
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/Ketik nama toko/).fill("Kopi Senja E2E");
    const sejak = new Date();
    const kirim = tungguKirim(page);
    await dialog.getByRole("button", { name: "Kirim kode dan lanjut" }).click();
    expect((await kirim).request().postDataJSON()).toEqual({ tujuan: "hapus-akun" });
    await expect(dialog.getByRole("heading", { name: 'Hapus "Kopi Senja E2E"' })).toBeVisible();

    const kode = await ambilOtp(email, sejak);
    await tempelKode(dialog.getByLabel("Digit 1 dari 6"), kode);
    await dialog.getByLabel("PIN Owner").fill("000000");
    await dialog.getByLabel("Password akun").fill(PASSWORD_AKUN_UJI);
    const tungguHapus = () =>
      page.waitForResponse((r) => r.request().method() === "DELETE" && /\/api\/akun\/profil$/.test(r.url()));
    let hapus = tungguHapus();
    await dialog.getByRole("button", { name: "Hapus permanen" }).click();
    expect((await hapus).status(), "PIN salah").toBe(400);
    await expect(dialog.getByRole("alert")).toContainText("PIN Owner salah");

    await dialog.getByLabel("PIN Owner").fill("123456");
    hapus = tungguHapus();
    await dialog.getByRole("button", { name: "Hapus permanen" }).click();
    const jawab = await hapus;
    expect(jawab.status(), "DELETE /akun/profil").toBe(200);
    expect(jawab.request().postDataJSON()).toEqual({
      pin: "123456",
      password: PASSWORD_AKUN_UJI,
      namaToko: "Kopi Senja E2E",
      otp: kode,
    });
    terhapus = true;

    await page.waitForURL(/\/login$/);
    await expect(page.getByText("Akun dihapus")).toBeVisible();
    const login = page.waitForResponse((r) => /\/api\/akun\/auth\/login$/.test(r.url()));
    await isiLoginAkun(page, email, PASSWORD_AKUN_UJI);
    expect((await login).ok(), "akun yang dihapus tidak dapat masuk lagi").toBe(false);
  } finally {
    if (!terhapus) await hapusAkunKlienUji(id, wajibAdmin());
  }
});
