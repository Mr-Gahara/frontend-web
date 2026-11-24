import { test, expect, type Page } from "@playwright/test";
import { balonPanduan, jalaniTur, periksaLetak } from "../../helpers/panduan-uji";
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
test.describe("Panduan langkah jam buka (JB9a)", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);
  test.use({ geolocation: { latitude: -0.02633, longitude: 109.342503 }, permissions: ["geolocation"] });

  test("tur tampil sendiri di langkah jam buka, dan Jam tertentu membuka keempat titiknya", async ({ page }) => {
    const { id } = await akunBaru(page, "panduanjam");
    const tutupTur = async () => {
      await expect(balon(page)).toBeVisible({ timeout: 15_000 });
      await page.keyboard.press("Escape");
      await expect(balon(page)).toHaveCount(0);
    };
    try {
      await tutupTur();
      await page.getByLabel("Nama toko", { exact: true }).fill("Kopi Senja E2E");
      await lanjut(page).click();
      await expect(langkahAktif(page)).toContainText("Owner");
      await tutupTur();
      await isiOwner(page);
      await tutupTur();
      await page.getByLabel("Nama outlet").fill("Outlet Panduan E2E");
      await page.getByLabel("Alamat").fill("Jl. Gajah Mada No. 12, Pontianak");
      await page.getByRole("button", { name: "Ambil koordinat dari perangkat ini" }).click();
      await expect(page.getByLabel("Latitude")).toHaveValue("-0.02633");
      await page.getByLabel("Radius absen (meter)").fill("30");
      await lanjut(page).click();
      await page
        .getByRole("alertdialog", { name: "Yakin Anda sedang di outlet?" })
        .getByRole("button", { name: "Ya, saya di outlet" })
        .click();
      await expect(langkahAktif(page)).toContainText("Jam buka toko", { timeout: 15_000 });

      // Tampil sendiri sekali; titik per hari belum ada selama mode belum dipilih.
      await expect(balon(page)).toBeVisible({ timeout: 15_000 });
      await expect(balon(page).getByText("Pilih kapan toko buka", { exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      expect(await tersimpan(page, "jamBuka")).toBe("dilihat");

      await page.getByRole("group", { name: "Toko buka kapan?" }).getByRole("button", { name: /^Jam tertentu/ }).click();
      // Samakan baru tampil sesudah satu hari berjam lengkap; sebelum itu
      // mesin melewatinya (keputusan JB9a: dilewati bila tidak tampil).
      const panduan = page.getByRole("button", { name: "Lihat panduan" });
      await panduan.click();
      await expect(balon(page)).toContainText("Panduan 1 dari 4");
      await balon(page).getByRole("button", { name: "Lanjut" }).click();
      await periksaLetak(page, "jam-hari");
      await balon(page).getByRole("button", { name: "Lanjut" }).click();
      await expect(balon(page)).toContainText("Panduan 4 dari 4");
      await page.keyboard.press("Escape");

      const senin = page.getByRole("list", { name: "Jam buka per hari" }).getByRole("listitem", { name: "Senin", exact: true });
      await senin.getByLabel("Jam buka Senin (jam)").fill("08");
      await senin.getByLabel("Jam buka Senin (menit)").fill("00");
      await senin.getByLabel("Jam tutup Senin (jam)").fill("22");
      await senin.getByLabel("Jam tutup Senin (menit)").fill("00");
      await panduan.click();
      await jalaniTur(page, ["jam-mode", "jam-hari", "jam-samakan", "lanjut"]);
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });
});
