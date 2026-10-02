import { test, expect, type Page } from "@playwright/test";
import {
  HP_PROFIL,
  HP_PROFIL_UBAH,
  NAMA_PROFIL,
  NAMA_PROFIL_UBAH,
  PIN_PROFIL,
  PIN_PROFIL_BARU,
  POLA_PENGGUNA,
  bacaPenggunaProfil,
  bukaProfil,
  pulihkanPenggunaProfil,
  siapkanPenggunaProfil,
  statusLoginPin,
} from "../../helpers/profil-uji";

/*
 * Spec pembanding halaman profil, ditulis dan dijalankan terhadap kode lama
 * sebelum migrasi (submodul 1 modul Profil, login, dan sidebar). Hanya
 * memuat perilaku yang tidak berubah setelah migrasi. Seluruh perubahan
 * dijalankan lewat UI sebagai pengguna uji "E2E Profil" (keputusan PF5a),
 * yang tidak memegang read-pengguna maupun update-pengguna; bukti dibaca
 * lewat API oleh Ridho. Nama dan PIN diubah sungguhan lalu dikembalikan
 * lewat UI, dan Ridho memulihkannya di finally bila test berhenti di tengah.
 */

const isianNama = (hal: Page) => hal.getByLabel(/Nama Lengkap/);
const isianHp = (hal: Page) => hal.getByLabel(/Nomor WhatsApp/);
const isianPinLama = (hal: Page) => hal.getByLabel("PIN Lama", { exact: true });
const isianPinBaru = (hal: Page) => hal.getByLabel("PIN Baru", { exact: true });

async function simpan(hal: Page) {
  const tunggu = hal.waitForResponse(
    (r) => r.request().method() === "PUT" && POLA_PENGGUNA.test(r.url()),
  );
  await hal.getByRole("button", { name: "Simpan Perubahan" }).click();
  return tunggu;
}

test.describe("Profil pengguna", () => {
  test.setTimeout(120_000);

  test("menampilkan data dari server bagi pengguna tanpa izin baca pengguna", async ({
    page,
    browser,
  }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      const data = await bacaPenggunaProfil(page, auth, id);
      await expect(hal.getByRole("heading", { name: "Profil Pengguna" })).toBeVisible();
      await expect(isianNama(hal)).toHaveValue(String(data.nama));
      // Nomor HP tidak ada di token, sehingga nilainya hanya dapat berasal
      // dari GET /pengguna/:id milik pengguna itu sendiri.
      await expect(isianHp(hal)).toHaveValue(HP_PROFIL);
      expect(data.nomorHp).toBe(HP_PROFIL);
      await expect(hal.getByRole("main").getByText(String(data.status), { exact: true })).toBeVisible();
    } finally {
      await ctx.close();
    }
  });

  test("nomor HP diubah lewat UI, tersimpan, lalu dikembalikan", async ({ page, browser }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await isianHp(hal).fill(HP_PROFIL_UBAH);
      const ubah = await simpan(hal);
      expect(ubah.status()).toBe(200);
      const payload = ubah.request().postDataJSON();
      expect(payload.nomorHp).toBe(HP_PROFIL_UBAH);
      expect(payload).not.toHaveProperty("pinBaru");
      expect((await bacaPenggunaProfil(page, auth, id)).nomorHp).toBe(HP_PROFIL_UBAH);

      await hal.reload();
      await expect(isianHp(hal)).toHaveValue(HP_PROFIL_UBAH, { timeout: 20_000 });
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

  test("nama diubah lewat UI, tersimpan, lalu dikembalikan", async ({ page, browser }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await isianNama(hal).fill(NAMA_PROFIL_UBAH);
      const ubah = await simpan(hal);
      expect(ubah.status()).toBe(200);
      expect(ubah.request().postDataJSON().nama).toBe(NAMA_PROFIL_UBAH);
      expect((await bacaPenggunaProfil(page, auth, id)).nama).toBe(NAMA_PROFIL_UBAH);

      await hal.reload();
      await expect(isianNama(hal)).toHaveValue(NAMA_PROFIL_UBAH, { timeout: 20_000 });
      await isianNama(hal).fill(NAMA_PROFIL);
      const kembali = await simpan(hal);
      expect(kembali.status()).toBe(200);
      expect((await bacaPenggunaProfil(page, auth, id)).nama).toBe(NAMA_PROFIL);
    } finally {
      await ctx.close();
      const pulih = await pulihkanPenggunaProfil(page, auth, id);
      expect.soft(pulih.status, `pulihkan: ${pulih.pesan}`).toBe(200);
    }
  });

  test("PIN lama yang salah ditolak backend dan PIN tidak berubah", async ({ page, browser }) => {
    await siapkanPenggunaProfil(page);
    const { ctx, hal } = await bukaProfil(browser);
    try {
      await isianPinLama(hal).fill("000000");
      await isianPinBaru(hal).fill(PIN_PROFIL_BARU);
      const tolak = await simpan(hal);
      expect(tolak.status()).toBe(401);
      const isi = await tolak.json();
      expect(String(isi.message)).toMatch(/PIN lama/i);
      // Tampilan pesan diperiksa lunak: cara halaman lama menangani 401 dari
      // operasi ini belum terbukti, dan run inilah yang menjawabnya.
      await expect.soft(hal.getByText(String(isi.message)).first()).toBeVisible();
    } finally {
      await ctx.close();
    }
    expect(await statusLoginPin(NAMA_PROFIL, PIN_PROFIL)).toBe(200);
  });

  test("PIN diubah lewat UI, berlaku saat login, lalu dikembalikan", async ({ page, browser }) => {
    const { auth, id } = await siapkanPenggunaProfil(page);
    try {
      const pertama = await bukaProfil(browser);
      try {
        await isianPinLama(pertama.hal).fill(PIN_PROFIL);
        await isianPinBaru(pertama.hal).fill(PIN_PROFIL_BARU);
        expect((await simpan(pertama.hal)).status()).toBe(200);
      } finally {
        await pertama.ctx.close();
      }

      // Login lewat UI dengan PIN baru membuktikan perubahan benar-benar berlaku.
      const kedua = await bukaProfil(browser, NAMA_PROFIL, PIN_PROFIL_BARU);
      try {
        await isianPinLama(kedua.hal).fill(PIN_PROFIL_BARU);
        await isianPinBaru(kedua.hal).fill(PIN_PROFIL);
        expect((await simpan(kedua.hal)).status()).toBe(200);
      } finally {
        await kedua.ctx.close();
      }

      expect(await statusLoginPin(NAMA_PROFIL, PIN_PROFIL)).toBe(200);
    } finally {
      const pulih = await pulihkanPenggunaProfil(page, auth, id);
      expect.soft(pulih.status, `pulihkan: ${pulih.pesan}`).toBe(200);
    }
  });
});