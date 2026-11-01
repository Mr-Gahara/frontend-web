import type { Page } from "@playwright/test";

/**
 * Alur masuk lewat UI yang dipakai bersama seluruh spec: login akun, lalu
 * login pengguna. Selector halaman login hanya ditulis di sini, agar
 * perubahan teks di halaman login cukup diikuti di satu tempat
 * (modul/setup-akun.md dan modul/profil-login.md).
 */

export const AKUN_UJI = { email: "toko@gmail.com", password: "Toko1234" } as const;
export const PENGGUNA_UJI = { nama: "Ridho", pin: "123456" } as const;

/** Tombol kirim di halaman login akun dan login pengguna. */
export const tombolMasuk = (page: Page) => page.getByRole("button", { name: /login/i });

/** Mengisi dan mengirim form login akun, tanpa menunggu pengalihan. */
export async function isiLoginAkun(page: Page, email: string, password: string) {
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await tombolMasuk(page).click();
}

/** Mengisi dan mengirim form login pengguna, tanpa menunggu pengalihan. */
export async function isiLoginPengguna(page: Page, nama: string, pin: string) {
  await page.getByLabel(/nama/i).fill(nama);
  await page.getByLabel(/pin/i).fill(pin);
  await tombolMasuk(page).click();
}

/** Login akun uji sampai halaman login pengguna. */
export async function masukAkun(page: Page) {
  await page.goto("/login");
  await isiLoginAkun(page, AKUN_UJI.email, AKUN_UJI.password);
  await page.waitForURL("**/login/pengguna");
}

/** Login akun uji lalu login pengguna sampai dashboard. */
export async function masuk(
  page: Page,
  nama: string = PENGGUNA_UJI.nama,
  pin: string = PENGGUNA_UJI.pin,
) {
  await masukAkun(page);
  await isiLoginPengguna(page, nama, pin);
  await page.waitForURL("**/dashboard");
}