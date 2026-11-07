import { expect, test, type Page } from "@playwright/test";
import { saldoAkun } from "../../helpers/akun-kas-uji";
import { unik } from "../../helpers/reservasi-uji";
import {
  NAMA_LACI_UJI,
  PERANGKAT_UJI,
  bersihkanMesinUji,
  bukaKasirLewatAplikasi,
  daftarMesin,
  detailSesi,
  siapkanLaciUji,
} from "../../helpers/sesi-kasir-uji";
import { bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";

/*
 * Alur nyata Mesin Kasir (inti/status.md, daftar periksa penyambungan nomor
 * 5): mesin kasir ditambah, diubah, dan dilepas lewat UI; sesi dibuka lewat
 * API aplikasi sebagai data milik modul lain (keputusan rancangan butir 23),
 * lalu ditutup dari web dengan hitung buta.
 */

const URL = "/dashboard/outlet/keuangan/mesinKasir";
const POLA_PERANGKAT = /\/api\/sesikasir\/perangkat(\/[0-9a-f]{24})?$/i;
const POLA_TUTUP = /\/api\/sesikasir\/[0-9a-f]{24}\/tutup$/i;
const SELISIH = 1_000;

const tunggu = (page: Page, pola: RegExp, method: string) =>
  page.waitForResponse((r) => pola.test(r.url()) && r.request().method() === method);

/** Isian Rupiah di dialog tutup menerima angka polos. */
const teksAngka = (n: number) => String(n);

test.describe("Mesin Kasir", () => {
  test("tambah mesin kasir, kasir dibuka dari aplikasi, ditutup dari web dengan catatan, lalu dilepas", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await login(page);
    const auth: Auth = await bukaDenganAuth(page, URL);
    const laci = await siapkanLaciUji(page, auth);
    await bersihkanMesinUji(page, auth, laci.id);
    const nama = `E2E Kasir ${unik()}`;
    const namaUbah = `${nama} Ubah`;

    try {
      await page.reload();
      await expect(page.getByRole("link", { name: "Mesin Kasir" })).toHaveAttribute("aria-current", "page", {
        timeout: 20_000,
      });

      // Tambah lewat UI: perangkat trusted, laci Kas Fisik uji, dan nama.
      await page.getByRole("button", { name: "Tambah mesin kasir" }).first().click();
      const tambah = page.getByRole("dialog", { name: "Tambah mesin kasir" });
      const radio = tambah.getByRole("radio", { name: new RegExp(PERANGKAT_UJI.nama) });
      await expect(radio).toHaveCount(1);
      await radio.check();
      await tambah.getByLabel("Nama mesin kasir").fill(nama);
      await tambah.getByRole("combobox", { name: "Laci uang" }).click();
      await page.getByRole("option", { name: new RegExp("^" + NAMA_LACI_UJI) }).click();
      const tSimpan = tunggu(page, POLA_PERANGKAT, "POST");
      await tambah.getByRole("button", { name: "Simpan" }).click();
      expect((await tSimpan).status()).toBe(200);
      await expect(page.getByText("Mesin kasir disimpan")).toBeVisible();
      await expect(page.getByRole("button", { name: `Aksi ${nama}` })).toBeVisible();

      const mesin = (await daftarMesin(page, auth)).find((m) => m.installationId === PERANGKAT_UJI.installationId);
      expect(mesin?.namaPerangkat).toBe(nama);
      expect(mesin?.akunKasID).toBe(laci.id);

      // Kasir dibuka dari aplikasi tanpa selisih.
      const saldoAwal = await saldoAkun(page, auth, laci.id);
      const sesi = await bukaKasirLewatAplikasi(saldoAwal);
      await page.reload();
      const kartu = page.getByRole("article", { name: `Kasir buka: ${nama}` });
      await expect(kartu).toBeVisible({ timeout: 20_000 });

      // Selama kasir buka: berhenti nonaktif, laci terkunci, nama tetap dapat diubah (MK9).
      await page.getByRole("button", { name: `Aksi ${nama}` }).click();
      await expect(page.getByRole("menuitem", { name: "Berhenti jadi mesin kasir" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await page.getByRole("menuitem", { name: "Ubah nama dan laci" }).click();
      const ubah = page.getByRole("dialog", { name: "Ubah mesin kasir" });
      await expect(ubah.getByRole("combobox", { name: "Laci uang" })).toBeDisabled();
      await ubah.getByLabel("Nama mesin kasir").fill(namaUbah);
      const tUbah = tunggu(page, POLA_PERANGKAT, "POST");
      await ubah.getByRole("button", { name: "Simpan" }).click();
      expect((await tUbah).status()).toBe(200);
      await expect(page.getByRole("article", { name: `Kasir buka: ${namaUbah}` })).toBeVisible();

      // Tutup dari web: hitungan berbeda tanpa catatan ditolak, lalu dengan catatan.
      await page
        .getByRole("article", { name: `Kasir buka: ${namaUbah}` })
        .getByRole("button", { name: "Tutup kasir dari web" })
        .click();
      const tutup = page.getByRole("dialog", { name: `Tutup kasir ${namaUbah}?` });
      await tutup.getByLabel("Uang yang dihitung di laci").fill(teksAngka(saldoAwal + SELISIH));
      const tTolak = tunggu(page, POLA_TUTUP, "POST");
      await tutup.getByRole("button", { name: "Tutup kasir", exact: true }).click();
      expect((await tTolak).status()).toBe(400);
      await expect(tutup.getByRole("alert")).toContainText(
        "Hitungan berbeda dengan catatan sistem. Tulis catatan penyebabnya, lalu tutup lagi.",
      );
      await tutup.getByLabel(/Catatan/).fill("E2E selisih uji");
      const tTutup = tunggu(page, POLA_TUTUP, "POST");
      await tutup.getByRole("button", { name: "Tutup kasir", exact: true }).click();
      expect((await tTutup).status()).toBe(200);
      await expect(page.getByText("Kasir ditutup")).toBeVisible();
      await expect(page.getByRole("article", { name: `Kasir buka: ${namaUbah}` })).toHaveCount(0);

      const tertutup = await detailSesi(page, auth, sesi.id);
      expect(tertutup.status).toBe("TUTUP");
      expect(tertutup.selisihTutup).toBe(SELISIH);
      expect(tertutup.catatanTutup).toBe("E2E selisih uji");
      expect(await saldoAkun(page, auth, laci.id)).toBe(saldoAwal + SELISIH);

      // Riwayat memuat sesi itu, dan rinciannya terbuka di rute final.
      await page.getByRole("link", { name: new RegExp(namaUbah) }).first().click();
      await expect(page).toHaveURL(new RegExp(`${URL}/${sesi.id}$`));
      await expect(page.getByRole("heading", { level: 1, name: new RegExp("^" + namaUbah + ", ") })).toBeVisible({
        timeout: 20_000,
      });
      await page.getByRole("link", { name: "Kembali ke Mesin Kasir" }).click();
      await expect(page).toHaveURL(new RegExp(URL + "$"));

      // Berhenti jadi mesin kasir; riwayatnya tetap, dengan nama mesin yang dilepas.
      await page.getByRole("button", { name: `Aksi ${namaUbah}` }).click();
      await page.getByRole("menuitem", { name: "Berhenti jadi mesin kasir" }).click();
      const konfirmasi = page.getByRole("alertdialog", { name: `${namaUbah} berhenti jadi mesin kasir?` });
      const tHapus = tunggu(page, POLA_PERANGKAT, "DELETE");
      await konfirmasi.getByRole("button", { name: "Berhenti" }).click();
      expect((await tHapus).status()).toBe(200);
      await expect(page.getByText("Mesin kasir dilepas")).toBeVisible();
      await expect(page.getByRole("button", { name: `Aksi ${namaUbah}` })).toHaveCount(0);
      expect((await daftarMesin(page, auth)).some((m) => m.installationId === PERANGKAT_UJI.installationId)).toBe(
        false,
      );

      // Tanpa mesin kasir lain, langkah tambah naik ke atas, tetapi riwayat yang
      // sudah ada tetap tampil (keputusan pemilik proyek, 7 November 2026).
      if ((await daftarMesin(page, auth)).length === 0) {
        await expect(page.getByRole("heading", { name: "Belum ada mesin kasir", level: 2 })).toBeVisible();
        await expect(page.getByText("Riwayat tampil di sini setelah kasir pertama ditutup.")).toHaveCount(0);
        await expect(page.getByRole("link", { name: /Mesin kasir yang sudah dilepas/ }).first()).toBeVisible();
      }
    } finally {
      await bersihkanMesinUji(page, auth, laci.id);
    }
  });

  test("HP: halaman dan rincian sesi tampil tanpa gulir ke samping", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    await page.goto(URL);
    await expect(page.getByRole("heading", { name: "Riwayat buka-tutup kasir" })).toBeVisible({ timeout: 20_000 });
    const tanpaGulir = async (konteks: string) => {
      const lebar = await page.evaluate(() => ({ isi: document.documentElement.scrollWidth, layar: window.innerWidth }));
      expect(lebar.isi, `${konteks}: lebar isi tidak melebihi layar`).toBeLessThanOrEqual(lebar.layar);
    };
    await tanpaGulir("halaman Mesin Kasir");

    // Rincian dari baris riwayat pertama; spec di atas meninggalkan sesi tertutup di riwayat.
    await expect(page.getByLabel("Memuat riwayat")).toHaveCount(0, { timeout: 20_000 });
    const baris = page.locator(`a[href^="${URL}/"]`).first();
    test.skip((await baris.count()) === 0, "Riwayat tujuh hari terakhir kosong");
    await baris.click();
    await expect(page.getByRole("link", { name: "Kembali ke Mesin Kasir" })).toBeVisible({ timeout: 20_000 });
    await tanpaGulir("rincian sesi");
  });
});
