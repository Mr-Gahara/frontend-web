import { expect, test, type Page } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";
import { AKUN_UJI, PENGGUNA_UJI, isiLoginAkun, isiLoginPengguna } from "../../helpers/masuk-uji";
import { NAMA_BACA_SAJA, masukBacaSaja } from "../../helpers/terkunci-uji";

/*
 * Data tidak terbawa ke pengguna atau akun berikutnya (pemilik proyek,
 * 12 November 2026): logout hanya berpindah halaman, sehingga cache React
 * Query bertahan, dan akun kas toko lain tampil di akun fresh tanpa satu pun
 * permintaan /akunkas. Kini cache dibersihkan saat akun atau pengguna lain
 * masuk (lib/auth/pemilik-cache.ts).
 *
 * Seluruh langkah memakai navigasi di dalam aplikasi (sidebar, logout, form
 * login) tanpa page.goto, karena memuat ulang halaman ikut membuang cache dan
 * menyembunyikan bug. Pergantian akun memakai mekanisme yang sama dan diuji di
 * tests/unit/lib/auth/pemilik-cache.test.ts.
 */

const POLA_AKUN_KAS = /\/api\/akunkas(\?|$)/i;

/** Membuka Akun Kas & Bank lewat sidebar dan mengembalikan jumlah GET /akunkas selama itu. */
async function bukaAkunKasLewatSidebar(page: Page): Promise<number> {
  let jumlah = 0;
  const hitung = (r: { method(): string; url(): string }) => {
    if (r.method() === "GET" && POLA_AKUN_KAS.test(r.url())) jumlah++;
  };
  page.on("request", hitung);
  const tautan = page.getByRole("link", { name: "Akun Kas & Bank", exact: true });
  if (!(await tautan.isVisible())) await page.getByRole("button", { name: "Keuangan", exact: true }).click();
  await tautan.click();
  await expect(page.getByRole("heading", { name: "Daftar Akun Kas & Bank" })).toBeVisible({ timeout: 20_000 });
  // Permintaan menyusul render pertama; beri waktu sebelum menghitung.
  await page.waitForLoadState("networkidle");
  page.off("request", hitung);
  return jumlah;
}

async function logoutLewatSidebar(page: Page, nama: string) {
  await page.getByRole("button", { name: new RegExp(nama) }).click();
  await page.getByRole("menuitem", { name: "Logout" }).click();
  await page.waitForURL("**/login");
}

test("pengguna berikutnya di tab yang sama memuat data sendiri, bukan cache pengguna sebelumnya", async ({ page }) => {
  await login(page);
  await masukBacaSaja(page);

  expect(await bukaAkunKasLewatSidebar(page), "pengguna pertama memuat akun kas").toBeGreaterThan(0);

  await logoutLewatSidebar(page, NAMA_BACA_SAJA);
  await isiLoginAkun(page, AKUN_UJI.email, AKUN_UJI.password);
  await page.waitForURL("**/login/pengguna");
  await isiLoginPengguna(page, PENGGUNA_UJI.nama, PENGGUNA_UJI.pin);
  await page.waitForURL("**/dashboard**");

  expect(
    await bukaAkunKasLewatSidebar(page),
    "pengguna kedua meminta akun kas ke backend, tidak membaca cache pengguna pertama",
  ).toBeGreaterThan(0);
});
