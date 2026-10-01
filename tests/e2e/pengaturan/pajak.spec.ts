import { expect, test } from "@playwright/test";
import { JAWAB_GAGAL, api, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { cocok, unik } from "../../helpers/reservasi-uji";
import { normalizeId } from "../../../lib/api/normalize";
import {
  NAMA_PRODUK_UJI,
  POLA_BUAT,
  POLA_DAFTAR,
  POLA_DETAIL,
  POLA_PASANG,
  POLA_RELASI,
  URL_PAJAK,
  barisPajak,
  buatLewatUi,
  cari,
  hapusPajakUji,
  isian,
  lepasSemuaRelasi,
  pastikanProdukUji,
  pemicu,
  relasiProduk,
  wajib,
  type PajakItem,
} from "../../helpers/pajak-uji";

/**
 * Spec pembanding pengaturan pajak, ditulis dan dijalankan terhadap halaman
 * lama sebelum migrasi (submodul pajak, keputusan PO1a). Hanya memuat
 * perilaku yang tidak berubah oleh PO6a sampai PO9a: daftar, buat, ubah, dan
 * hapus pajak per produk, simpan yang gagal, serta pasang dan lepas pajak
 * per produk pada produk uji khusus. Tabel relasi, prioritas, dan dialog
 * hapus yang gagal diuji di spec migrasi.
 *
 * Setiap operasi pajak yang diuji dijalankan lewat UI, termasuk membuat pajak
 * uji, agar tombol dan fungsi yang rusak ikut terlihat (pemilik proyek,
 * 1 Oktober 2026). API hanya dipakai untuk membaca bukti, menyiapkan produk
 * uji milik modul produk, dan membersihkan sisa run yang gagal.
 *
 * Data uji (PO10a): pajak per transaksi tidak pernah dibuat maupun
 * diaktifkan, agar PPN tenant uji tidak dinonaktifkan backend. Pajak uji per
 * produk bernama unik dan dihapus di akhir; hapus pajak ikut menghapus
 * relasinya. Produk uji dibuat sekali lalu dipakai ulang, karena memasang
 * pajak menimpa relasi produk itu (upsert per produk di
 * produkPajakService.assignPajak), sehingga produk lain tidak boleh dipakai.
 * Form buat lama menahan submit sampai prioritas diketik; sejak migrasi
 * prioritas berupa pilihan 1 atau 2 (PO8a), dan spec memilihnya. Helper
 * bersama ada di tests/helpers/pajak-uji.ts.
 */

test.describe("E2E — Pengaturan pajak (pembanding)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("daftar memuat GET /pajak dan menampilkan kolom serta isi baris", async ({ page }) => {
    await bukaDenganAuth(page, URL_PAJAK);
    await page.goto(URL_PAJAK, { waitUntil: "commit" });
    const res = await page.waitForResponse(cocok("GET", POLA_DAFTAR));
    expect(res.status()).toBe(200);
    const data = normalizeId(((await res.json()) as { data: PajakItem[] }).data) as PajakItem[];
    expect(data.length, "tenant uji punya minimal satu pajak").toBeGreaterThan(0);
    for (const kolom of ["Nama Pajak", "Tarif", "Model", "Prioritas", "Status", "Aksi"]) {
      await expect(page.getByRole("columnheader", { name: kolom, exact: true })).toBeVisible();
    }
    const p = data[0];
    await cari(page, p.namaPajak);
    const baris = barisPajak(page, p.namaPajak);
    await expect(baris).toHaveCount(1);
    await expect(baris).toContainText(`${p.tarifPajak}%`);
    await expect(baris.getByText(p.statusPajak ? "Aktif" : "Non-Aktif", { exact: true })).toBeVisible();
  });

  test("buat, ubah, lalu hapus pajak per produk lewat UI", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PAJAK);
    const nama = "E2E PJK " + unik();
    let id: string | undefined;
    try {
      await test.step("buat dengan nilai awal form", async () => {
        await buatLewatUi(page, nama, "5", (baru) => {
          id = baru;
        });
        const tersimpan = wajib(await api<PajakItem>(page, auth, "GET", "/pajak/" + id), "GET pajak uji");
        expect(tersimpan).toMatchObject({
          namaPajak: nama,
          tarifPajak: 5,
          tipePajak: true,
          modelPerhitungan: 2,
          prioritas: 1,
          statusPajak: true,
        });
        await cari(page, nama);
        const baris = barisPajak(page, nama);
        await expect(baris).toContainText("5%");
        await expect(baris).toContainText("Add-on (Eksklusif)");
        await expect(baris.getByText("Aktif", { exact: true })).toBeVisible();
      });

      await test.step("ubah tarif", async () => {
        const baris = barisPajak(page, nama);
        await baris.getByRole("button").click();
        await page.getByRole("menuitem", { name: "Edit" }).click();
        const dialog = page.getByRole("dialog", { name: "Edit Pajak" });
        const tarif = isian(dialog, "Tarif (%)");
        await expect(tarif).toHaveValue("5");
        await tarif.fill("7");
        const tJawab = page.waitForResponse(cocok("PUT", POLA_DETAIL));
        await dialog.getByRole("button", { name: "Simpan" }).click();
        expect((await tJawab).status()).toBe(200);
        await expect(dialog).toBeHidden();
        await expect(baris).toContainText("7%");
        const tersimpan = wajib(await api<PajakItem>(page, auth, "GET", "/pajak/" + id), "GET pajak uji");
        expect(tersimpan.tarifPajak).toBe(7);
        expect(tersimpan.tipePajak).toBe(true);
      });

      await test.step("hapus", async () => {
        const baris = barisPajak(page, nama);
        await baris.getByRole("button").click();
        await page.getByRole("menuitem", { name: "Hapus" }).click();
        const dialog = page.getByRole("alertdialog");
        await expect(dialog).toContainText(nama);
        const tJawab = page.waitForResponse(cocok("DELETE", POLA_DETAIL));
        await dialog.getByRole("button", { name: "Lanjutkan" }).click();
        expect((await tJawab).status()).toBe(200);
        await expect(baris).toHaveCount(0);
        const sesudah = await api(page, auth, "GET", "/pajak/" + id);
        expect(sesudah.status, "pajak terhapus dari backend").toBe(404);
        id = undefined;
      });
    } finally {
      await hapusPajakUji(page, auth, id);
    }
  });

  test("simpan yang gagal: dialog bertahan dengan pesan backend, tanpa data tersimpan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PAJAK);
    const nama = "E2E PJK " + unik();
    await page.route(POLA_BUAT, (route) =>
      route.request().method() === "POST" ? route.fulfill(JAWAB_GAGAL) : route.continue(),
    );
    try {
      await page.getByRole("button", { name: "Tambah Pajak" }).click();
      const dialog = page.getByRole("dialog", { name: "Tambah Pajak" });
      await isian(dialog, "Nama Pajak").fill(nama);
      await isian(dialog, "Tarif (%)").fill("5");
      await dialog.getByRole("combobox", { name: "Prioritas" }).click();
      await page.getByRole("option", { name: "1", exact: true }).click();
      const tJawab = page.waitForResponse(cocok("POST", POLA_BUAT));
      await dialog.getByRole("button", { name: "Simpan" }).click();
      expect((await tJawab).status()).toBe(500);
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("uji", { exact: true })).toBeVisible();
    } finally {
      await page.unroute(POLA_BUAT);
    }
    const daftar = wajib(await api<PajakItem[]>(page, auth, "GET", "/pajak"), "GET /pajak");
    expect(daftar.some((p) => p.namaPajak === nama), "tidak ada pajak tersimpan").toBe(false);
  });

  test("pajak per produk: pasang dan lepas pada produk uji; pajak per transaksi tidak ditawarkan", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PAJAK);
    const produk = await pastikanProdukUji(page, auth);
    await lepasSemuaRelasi(page, auth, produk.id);
    const nama = "E2E PJK " + unik();
    let pajakId: string | undefined;
    try {
      await page.reload();
      await buatLewatUi(page, nama, "5", (baru) => {
        pajakId = baru;
      });
      const semua = wajib(await api<PajakItem[]>(page, auth, "GET", "/pajak"), "GET /pajak");
      const perTransaksi = semua.filter((p) => p.tipePajak === false);
      await page.getByRole("tab", { name: "Pajak per Produk" }).click();
      await pemicu(page, "Pilih produk").click();
      const tRelasi = page.waitForResponse(cocok("GET", POLA_RELASI));
      await page.getByRole("option", { name: NAMA_PRODUK_UJI, exact: true }).click();
      expect((await tRelasi).status()).toBe(200);
      await expect(page.getByRole("button", { name: "Lepas" })).toHaveCount(0);

      await pemicu(page, "Pilih pajak").click();
      await expect(page.getByRole("option", { name: `${nama} (5%)`, exact: true })).toBeVisible();
      for (const t of perTransaksi) {
        await expect(page.getByRole("option", { name: `${t.namaPajak} (${t.tarifPajak}%)`, exact: true })).toHaveCount(0);
      }
      await page.getByRole("option", { name: `${nama} (5%)`, exact: true }).click();

      const tKirim = page.waitForRequest((r) => r.method() === "POST" && POLA_PASANG.test(r.url()));
      const tPasang = page.waitForResponse(cocok("POST", POLA_PASANG));
      await page.getByRole("button", { name: "Assign" }).click();
      expect((await tKirim).postDataJSON()).toEqual({ produkID: produk.id, pajakID: pajakId });
      expect((await tPasang).status()).toBe(201);
      await expect(page.getByRole("button", { name: "Lepas" })).toHaveCount(1);
      const terpasang = await relasiProduk(page, auth, produk.id);
      expect(terpasang.map((r) => r.pajak.id)).toEqual([pajakId]);

      const tLepas = page.waitForResponse(cocok("DELETE", POLA_RELASI));
      await page.getByRole("button", { name: "Lepas" }).click();
      expect((await tLepas).status()).toBe(200);
      await expect(page.getByRole("button", { name: "Lepas" })).toHaveCount(0);
      expect(await relasiProduk(page, auth, produk.id)).toEqual([]);
    } finally {
      await hapusPajakUji(page, auth, pajakId);
    }
  });

  test("tombol kembali menuju halaman pengaturan", async ({ page }) => {
    await page.goto(URL_PAJAK);
    await page.getByRole("button", { name: "Kembali ke Laman Pengaturan" }).click();
    await expect(page).toHaveURL(/\/dashboard\/outlet\/pengaturan$/);
  });
});