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
import { isiLoginPengguna } from "../../helpers/masuk-uji";
import { tanpaGulirSamping, tanpaLuberWadah } from "../../helpers/tata-letak-uji";

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
// Laman profil desain C (PU1a): tombol Data Diri dan Ganti PIN di tab masing-masing.
const tombolSimpan = (hal: Page) => hal.getByRole("button", { name: "Simpan Data Diri" });
const tombolGantiPin = (hal: Page) => hal.getByRole("button", { name: "Ganti PIN" });
const bukaTabPin = (hal: Page) => hal.getByRole("tab", { name: "Keamanan PIN" }).click();
const adalahPut = (method: string, url: string) => method === "PUT" && POLA_PENGGUNA.test(url);

async function simpan(hal: Page) {
  const tunggu = hal.waitForResponse((r) => adalahPut(r.request().method(), r.url()));
  await tombolSimpan(hal).click();
  return tunggu;
}

test.describe("Kelola profil pengguna", () => {
  test.setTimeout(120_000);

  test("tampilan: simpan nonaktif tanpa perubahan, tanpa Zona Bahaya (OA8a), dan isian tersaring", async ({
    page,
    browser,
  }) => {
    await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await expect(tombolSimpan(hal)).toBeDisabled();
      // Hapus akun pindah ke halaman Akun Toko di Pengaturan (OA8a).
      await expect(hal.getByText("Zona Bahaya")).toHaveCount(0);
      await expect(hal.getByRole("button", { name: /Hapus Akun/i })).toHaveCount(0);
      await expect(hal.getByRole("main").locator('img[src*="github.com"]')).toHaveCount(0);

      await isianHp(hal).fill("");
      await isianHp(hal).pressSequentially("+62 8ab12");
      await expect(isianHp(hal)).toHaveValue("+62812");
      await bukaTabPin(hal);
      await expect(hal).toHaveURL(/[?&]tab=keamanan-pin/);
      await isianPinBaru(hal).pressSequentially("12a3");
      await expect(isianPinBaru(hal)).toHaveValue("123");
    } finally {
      await ctx.close();
    }
  });

  test("tata letak desain C di HP, tablet, dan laptop: tab, ringkasan, dan tanpa luber (PU1a)", async ({
    page,
    browser,
  }) => {
    await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      const url = hal.url().split("?")[0];
      for (const [lebar, tinggi] of [[390, 844], [768, 1024], [1280, 800]] as const) {
        await hal.setViewportSize({ width: lebar, height: tinggi });
        await hal.goto(url);
        await expect(hal.getByRole("heading", { level: 1 })).toHaveText(NAMA_PROFIL, { timeout: 20_000 });
        await expect(hal.getByRole("tab", { name: "Data Diri" })).toHaveAttribute("aria-selected", "true");
        const ringkasan = hal.getByRole("definition");
        await expect(ringkasan).toHaveCount(4);
        await expect(hal.getByText("Tidak dibatasi", { exact: true })).toBeVisible();
        const tab = await hal.getByRole("tablist").boundingBox();
        const isi = await hal.getByRole("tabpanel").boundingBox();
        expect(tab && isi && isi.y >= tab.y + tab.height, `tab di atas isi pada ${lebar} px`).toBe(true);
        await tanpaGulirSamping(hal, `profil ${lebar} px`);
        await tanpaLuberWadah(hal, `profil ${lebar} px`);

        await hal.goto(url + "?tab=keamanan-pin");
        await expect(hal.getByRole("tab", { name: "Keamanan PIN" })).toHaveAttribute("aria-selected", "true", {
          timeout: 20_000,
        });
        await expect(isianPinLama(hal)).toBeVisible();
        await tanpaGulirSamping(hal, `profil tab PIN ${lebar} px`);
      }
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
      await bukaTabPin(hal);
      await tombolGantiPin(hal).click();
      await expect(hal.getByText("PIN baru wajib diisi")).toBeVisible();
      await isianPinLama(hal).fill(PIN_PROFIL);
      await isianPinBaru(hal).fill("1234");
      await tombolGantiPin(hal).click();
      await expect(hal.getByText("PIN baru harus tepat 6 digit angka")).toBeVisible();
      await isianPinLama(hal).fill("");
      await isianPinBaru(hal).fill(PIN_PROFIL_BARU);
      await tombolGantiPin(hal).click();
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
      await bukaTabPin(hal);
      await isianPinLama(hal).fill(PIN_PROFIL);
      await isianPinBaru(hal).fill(PIN_PROFIL_BARU);
      const tunggu = hal.waitForResponse((r) => adalahPut(r.request().method(), r.url()));
      await tombolGantiPin(hal).click();
      const ubah = await tunggu;
      expect(ubah.status()).toBe(200);
      expect(ubah.request().postDataJSON()).toEqual({
        pinLama: PIN_PROFIL,
        pinBaru: PIN_PROFIL_BARU,
      });

      await hal.waitForURL("**/login/pengguna");
      await expect(hal.getByText("Silakan login kembali dengan PIN baru Anda.")).toBeVisible();
      await isiLoginPengguna(hal, NAMA_PROFIL, PIN_PROFIL_BARU);
      await hal.waitForURL("**/dashboard");
    } finally {
      await ctx.close();
      const pulih = await pulihkanPenggunaProfil(page, auth, id);
      expect.soft(pulih.status, `pulihkan: ${pulih.pesan}`).toBe(200);
    }
  });
});