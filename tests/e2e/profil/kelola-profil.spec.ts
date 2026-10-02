import { test, expect, type Page } from "@playwright/test";
import {
  HP_PROFIL,
  HP_PROFIL_UBAH,
  NAMA_PROFIL,
  PIN_PROFIL,
  PIN_PROFIL_BARU,
  POLA_PENGGUNA,
  bacaPenggunaProfil,
  bukaProfil,
  pulihkanPenggunaProfil,
  siapkanPenggunaProfil,
} from "../../helpers/profil-uji";

/*
 * Spec migrasi halaman profil (keputusan PF2a, PF7a, PF8a, dan PF9a).
 * Perilaku yang berubah dari halaman lama: hanya field yang berubah yang
 * dikirim, nomor HP dikosongkan sebagai null, PIN baru tepat 6 digit,
 * pengalihan ke login PIN setelah PIN berubah, dan tombol hapus akun
 * nonaktif. Seluruhnya lewat UI sebagai pengguna uji "E2E Profil".
 */

const isianHp = (hal: Page) => hal.getByLabel(/Nomor WhatsApp/);
const isianPinLama = (hal: Page) => hal.getByLabel("PIN Lama", { exact: true });
const isianPinBaru = (hal: Page) => hal.getByLabel("PIN Baru", { exact: true });
const tombolSimpan = (hal: Page) => hal.getByRole("button", { name: "Simpan Perubahan" });
const adalahPut = (method: string, url: string) => method === "PUT" && POLA_PENGGUNA.test(url);

async function simpan(hal: Page) {
  const tunggu = hal.waitForResponse((r) => adalahPut(r.request().method(), r.url()));
  await tombolSimpan(hal).click();
  return tunggu;
}

test.describe("Kelola profil pengguna", () => {
  test.setTimeout(120_000);

  test("tampilan: simpan nonaktif tanpa perubahan, hapus akun nonaktif, dan isian tersaring", async ({
    page,
    browser,
  }) => {
    await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await expect(tombolSimpan(hal)).toBeDisabled();
      await expect(hal.getByRole("button", { name: "Hapus Akun" })).toBeDisabled();
      await expect(hal.getByText("Fitur ini belum tersedia.")).toBeVisible();
      await expect(hal.getByRole("main").locator('img[src*="github.com"]')).toHaveCount(0);

      await isianHp(hal).fill("");
      await isianHp(hal).pressSequentially("+62 8ab12");
      await expect(isianHp(hal)).toHaveValue("+62812");
      await isianPinBaru(hal).pressSequentially("12a3");
      await expect(isianPinBaru(hal)).toHaveValue("123");
    } finally {
      await ctx.close();
    }
  });

  test("PIN baru di bawah 6 digit ditolak form tanpa permintaan", async ({ page, browser }) => {
    await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    let terkirim = 0;
    const hitung = (r: { method(): string; url(): string }) => {
      if (adalahPut(r.method(), r.url())) terkirim++;
    };
    hal.on("request", hitung);
    try {
      await isianPinLama(hal).fill(PIN_PROFIL);
      await isianPinBaru(hal).fill("1234");
      await tombolSimpan(hal).click();
      await expect(hal.getByText("PIN baru harus tepat 6 digit angka")).toBeVisible();
      await isianPinLama(hal).fill("");
      await isianPinBaru(hal).fill(PIN_PROFIL_BARU);
      await tombolSimpan(hal).click();
      await expect(
        hal.getByText("Masukkan PIN lama untuk mengonfirmasi perubahan"),
      ).toBeVisible();
      expect(terkirim).toBe(0);
    } finally {
      hal.off("request", hitung);
      await ctx.close();
    }
  });

  test("hanya field yang berubah yang dikirim", async ({ page, browser }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await isianHp(hal).fill(HP_PROFIL_UBAH);
      const ubah = await simpan(hal);
      expect(ubah.status()).toBe(200);
      expect(ubah.request().postDataJSON()).toEqual({ nomorHp: HP_PROFIL_UBAH });

      // Form dipasang ulang dengan nilai tersimpan, sehingga simpan kembali nonaktif.
      await expect(tombolSimpan(hal)).toBeDisabled();
      await expect(isianHp(hal)).toHaveValue(HP_PROFIL_UBAH);
      await isianHp(hal).fill(HP_PROFIL);
      const kembali = await simpan(hal);
      expect(kembali.status()).toBe(200);
      expect(kembali.request().postDataJSON()).toEqual({ nomorHp: HP_PROFIL });
      expect((await bacaPenggunaProfil(page, auth, id)).nomorHp).toBe(HP_PROFIL);
    } finally {
      await ctx.close();
      const pulih = await pulihkanPenggunaProfil(page, auth, id);
      expect.soft(pulih.status, `pulihkan: ${pulih.pesan}`).toBe(200);
    }
  });

  test("nomor HP yang dikosongkan dikirim sebagai null dan tersimpan kosong", async ({
    page,
    browser,
  }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await isianHp(hal).fill("");
      const kosong = await simpan(hal);
      expect(kosong.status()).toBe(200);
      expect(kosong.request().postDataJSON()).toEqual({ nomorHp: null });
      expect((await bacaPenggunaProfil(page, auth, id)).nomorHp).toBeNull();

      await hal.reload();
      await expect(hal.getByLabel(/Nama Lengkap/)).toHaveValue(NAMA_PROFIL, { timeout: 20_000 });
      await expect(isianHp(hal)).toHaveValue("");
      await isianHp(hal).fill(HP_PROFIL);
      const kembali = await simpan(hal);
      expect(kembali.status()).toBe(200);
      expect((await bacaPenggunaProfil(page, auth, id)).nomorHp).toBe(HP_PROFIL);
    } finally {
      await ctx.close();
      const pulih = await pulihkanPenggunaProfil(page, auth, id);
      expect.soft(pulih.status, `pulihkan: ${pulih.pesan}`).toBe(200);
    }
  });

  test("setelah PIN berubah: pesan tampil, kembali ke login PIN, dan PIN baru dipakai masuk", async ({
    page,
    browser,
  }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await isianPinLama(hal).fill(PIN_PROFIL);
      await isianPinBaru(hal).fill(PIN_PROFIL_BARU);
      const ubah = await simpan(hal);
      expect(ubah.status()).toBe(200);
      expect(ubah.request().postDataJSON()).toEqual({
        pinLama: PIN_PROFIL,
        pinBaru: PIN_PROFIL_BARU,
      });

      await hal.waitForURL("**/login/pengguna");
      await expect(hal.getByText("Silakan login kembali dengan PIN baru Anda.")).toBeVisible();
      await hal.getByLabel(/nama/i).fill(NAMA_PROFIL);
      await hal.getByLabel(/pin/i).fill(PIN_PROFIL_BARU);
      await hal.getByRole("button", { name: /login/i }).click();
      await hal.waitForURL("**/dashboard");
    } finally {
      await ctx.close();
      const pulih = await pulihkanPenggunaProfil(page, auth, id);
      expect.soft(pulih.status, `pulihkan: ${pulih.pesan}`).toBe(200);
    }
  });
});