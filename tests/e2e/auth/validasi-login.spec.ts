import { test, expect, type Page, type Request } from "@playwright/test";

/*
 * Validasi form login lewat skema (keputusan PF3a), menggantikan validasi
 * HTML5 browser: pesan tampil di bawah isian, dan tidak ada permintaan yang
 * terkirim selama isian belum sah. Tidak ada percobaan login yang gagal di
 * backend, sehingga pembatas login tidak terhitung.
 */
const BASIS = "http://localhost:3000";
const POLA_LOGIN_AKUN = /\/api\/akun\/auth\/login(\?|$)/i;
const POLA_LOGIN_PENGGUNA = /\/api\/pengguna\/pin-login(\?|$)/i;

const tombolLogin = (page: Page) => page.getByRole("button", { name: /masuk|login/i });

function hitungPermintaan(page: Page, pola: RegExp) {
  let jumlah = 0;
  const catat = (r: Request) => {
    if (pola.test(r.url())) jumlah++;
  };
  page.on("request", catat);
  return { jumlah: () => jumlah, lepas: () => page.off("request", catat) };
}

test.describe("Validasi form login", () => {
  test("login akun: isian kosong dan email berformat salah ditolak tanpa permintaan", async ({
    page,
  }) => {
    await page.goto(BASIS + "/login");
    const hitung = hitungPermintaan(page, POLA_LOGIN_AKUN);
    try {
      await tombolLogin(page).click();
      await expect(page.getByText("Email wajib diisi")).toBeVisible();
      await expect(page.getByText("Password wajib diisi")).toBeVisible();

      await page.getByLabel(/email/i).fill("ini-bukan-email");
      await page.getByLabel(/password/i).fill("Toko1234");
      await tombolLogin(page).click();
      await expect(page.getByText("Format email tidak valid")).toBeVisible();
      await expect(page.getByText("Password wajib diisi")).toHaveCount(0);
      await expect(page).toHaveURL(/\/login$/);
      expect(hitung.jumlah()).toBe(0);
    } finally {
      hitung.lepas();
    }
  });

  test("login pengguna: isian kosong ditolak tanpa permintaan, dan ganti akun berupa tombol", async ({
    page,
  }) => {
    await page.goto(BASIS + "/login");
    await page.getByLabel(/email/i).fill("toko@gmail.com");
    await page.getByLabel(/password/i).fill("Toko1234");
    await tombolLogin(page).click();
    await page.waitForURL("**/login/pengguna");

    const hitung = hitungPermintaan(page, POLA_LOGIN_PENGGUNA);
    try {
      await tombolLogin(page).click();
      await expect(page.getByText("Nama pengguna wajib diisi")).toBeVisible();
      await expect(page.getByText("PIN wajib diisi")).toBeVisible();
      expect(hitung.jumlah()).toBe(0);
      await expect(page.getByRole("button", { name: "Ganti Akun Bisnis" })).toBeVisible();
    } finally {
      hitung.lepas();
    }
  });
});