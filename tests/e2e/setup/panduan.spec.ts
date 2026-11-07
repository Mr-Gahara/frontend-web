import { test, expect, type Page } from "@playwright/test";
import { balonPanduan, jalaniTur } from "../../helpers/panduan-uji";
import { ALASAN_TANPA_ADMIN, hapusAkunKlienUji, kredensialAdmin, wajibAdmin } from "../../helpers/admin-uji";
import { PIN_OWNER, akunBaru, langkahAktif, lanjut } from "../../helpers/setup-uji";

/*
 * Tur sorotan wizard setup (keputusan pemilik proyek, 7 November 2026).
 * playwright.config.ts mematikan tur otomatis untuk semua spec lewat
 * storageState; spec ini mengosongkannya karena yang diuji justru tur yang
 * tampil sendiri. Teks titik diambil dari features/setup/titik-panduan.ts.
 */
test.use({ storageState: { cookies: [], origins: [] } });
test.describe.configure({ timeout: 120_000 });

const balon = balonPanduan;

const tersimpan = (page: Page, kunci: string) =>
  page.evaluate((k) => localStorage.getItem(`tachyon.panduan.v1.setup.${k}`), kunci);

async function isiOwner(page: Page) {
  await page.getByLabel("Nama Owner", { exact: true }).fill("Rina E2E");
  await page.getByLabel("PIN", { exact: true }).fill(PIN_OWNER);
  await page.getByLabel("Ulangi PIN").fill(PIN_OWNER);
  await lanjut(page).click();
  await expect(langkahAktif(page)).toContainText("Lokasi outlet", { timeout: 15_000 });
}

test.describe("Panduan wizard setup", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("tur tampil sendiri sekali per langkah, dapat dibuka ulang, dan tidak ada di ringkasan tersimpan", async ({
    page,
  }) => {
    const { id } = await akunBaru(page, "panduan");
    try {
      await test.step("nama toko: tampil sendiri, lalu Selesai mencatatnya", async () => {
        await expect(balon(page)).toBeVisible();
        await expect(balon(page).getByText("Isi nama toko", { exact: true })).toBeVisible();
        await jalaniTur(page, ["nama-toko", "lanjut"]);
        expect(await tersimpan(page, "toko")).toBe("dilihat");
      });

      await test.step("dimuat ulang: tidak tampil sendiri lagi, Lihat panduan membukanya, Escape menutup", async () => {
        await page.reload();
        await expect(langkahAktif(page)).toHaveText("1Nama toko", { timeout: 15_000 });
        // Tur otomatis dibuka 400 ms setelah langkah tampil; ditunggu lebih lama
        // agar ketiadaannya benar-benar teruji.
        await page.waitForTimeout(1_500);
        await expect(balon(page)).toHaveCount(0);
        await page.getByRole("button", { name: "Lihat panduan" }).click();
        await expect(balon(page)).toContainText("Panduan 1 dari 2");
        await page.keyboard.press("Escape");
        await expect(balon(page)).toHaveCount(0);
      });

      await test.step("Owner: kunci baru tampil sendiri; isian tetap dapat diketik selama tur terbuka", async () => {
        await page.getByLabel("Nama toko", { exact: true }).fill("Kopi Senja E2E");
        await lanjut(page).click();
        await expect(langkahAktif(page)).toContainText("Owner");
        await expect(balon(page)).toContainText("Isi nama Owner");
        await page.getByLabel("Nama Owner", { exact: true }).fill("Rina E2E");
        await expect(balon(page), "mengetik di luar balon tidak menutup tur").toBeVisible();
        await balon(page).getByRole("button", { name: "Lewati panduan" }).click();
        await expect(balon(page)).toHaveCount(0);
        expect(await tersimpan(page, "owner")).toBe("dilihat");
        await isiOwner(page);
      });

      await test.step("lokasi: tombol tutup mencatat tur; ringkasan tersimpan tanpa Lihat panduan", async () => {
        await expect(balon(page)).toContainText("Panduan 1 dari 4");
        await balon(page).getByRole("button", { name: "Tutup panduan" }).click();
        await expect(balon(page)).toHaveCount(0);
        expect(await tersimpan(page, "lokasi")).toBe("dilihat");
        await page.getByRole("button", { name: "Kembali" }).click();
        await expect(page.getByText("Langkah ini sudah tersimpan.")).toBeVisible();
        await expect(page.getByRole("button", { name: "Lihat panduan" })).toHaveCount(0);
        await expect(balon(page)).toHaveCount(0);
      });
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });

  test("pindah langkah di tengah tur mencatat tur sudah dilihat", async ({ page }) => {
    const { id } = await akunBaru(page, "panduanpindah");
    try {
      await expect(balon(page)).toContainText("Panduan 1 dari 2");
      await page.getByLabel("Nama toko", { exact: true }).fill("Kopi Senja E2E");
      // Di titik terakhir balon berada di atas tombol lanjut, sehingga tombolnya
      // dapat ditekan tanpa menutup tur lebih dulu.
      await balon(page).getByRole("button", { name: "Lanjut" }).click();
      await expect(balon(page)).toContainText("Tekan Simpan dan lanjut");
      await lanjut(page).click();
      await expect(langkahAktif(page)).toContainText("Owner");
      expect(await tersimpan(page, "toko")).toBe("dilihat");
      await expect(balon(page)).toContainText("Isi nama Owner");
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });

  test.describe("di HP", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("balon dan elemen yang disorot selalu di dalam layar", async ({ page }) => {
      const { id } = await akunBaru(page, "panduanhp");
      try {
        await jalaniTur(page, ["nama-toko", "lanjut"]);
        await page.getByLabel("Nama toko", { exact: true }).fill("Kopi Senja E2E");
        await lanjut(page).click();
        await expect(langkahAktif(page)).toContainText("Owner");
        await jalaniTur(page, ["owner-nama", "owner-pin", "lanjut"]);
        await isiOwner(page);
        await jalaniTur(page, ["lokasi-nama", "lokasi-koordinat", "lokasi-radius", "lanjut"]);
      } finally {
        await hapusAkunKlienUji(id, wajibAdmin());
      }
    });
  });
});