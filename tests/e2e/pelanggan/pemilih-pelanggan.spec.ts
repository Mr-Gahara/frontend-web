import { test, expect, type Page } from "@playwright/test";
import { BASIS, bukaDenganAuth, login, type Auth } from "../../helpers/transfer-uji";
import { labelPelanggan } from "../../../features/pelanggan/tampilan";

/*
 * Pemilih pelanggan di buat penjualan dan buat reservasi. Sejak backend
 * nizar 8dc6211 nama pelanggan boleh kembar dan pembedanya nomor HP, sehingga
 * kedua pemilih harus dapat mencari lewat nomor HP dan menampilkannya di
 * baris pilihan serta di pemicu setelah dipilih.
 *
 * Pelanggan uji adalah data milik modul lain bagi kedua halaman ini
 * (keputusan rancangan butir 23): dibuat lewat API dengan nama dan nomor HP
 * unik per run, lalu dihapus di finally. Tidak ada penjualan maupun booking
 * yang disimpan.
 */

const URL_PENJUALAN = BASIS + "/dashboard/outlet/penjualan/buatPenjualan";
const URL_RESERVASI = BASIS + "/dashboard/outlet/reservasi/buatReservasi";
const API_PELANGGAN = BASIS + "/api/pelanggan";

type PelangganUji = { id: string; namaPelanggan: string; nomorHp: string };

async function buatPelangganUji(page: Page, auth: Auth): Promise<PelangganUji> {
  const data = {
    namaPelanggan: "E2E Pemilih " + Date.now().toString(36),
    tipePelanggan: "umum",
    nomorHp: "08" + String(Date.now()).slice(-10),
  };
  const res = await page.request.post(API_PELANGGAN, {
    headers: { Authorization: auth() },
    data,
  });
  const isi = await res.json().catch(() => ({}));
  expect(res.status(), "POST /pelanggan: " + String(isi.message)).toBe(201);
  return { id: String(isi.data.id), namaPelanggan: data.namaPelanggan, nomorHp: data.nomorHp };
}

async function hapusPelangganUji(page: Page, auth: Auth, id: string) {
  const res = await page.request.delete(API_PELANGGAN + "/" + id, {
    headers: { Authorization: auth() },
  });
  expect.soft([200, 404], "DELETE pelanggan uji").toContain(res.status());
}

test.describe("Pemilih pelanggan menampilkan nomor HP", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("buat penjualan: pelanggan dicari lewat nomor HP, dan nomornya tampil di pilihan serta pemicu", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_PENJUALAN);
    const uji = await buatPelangganUji(page, auth);
    try {
      // Dimuat ulang penuh agar daftar pelanggan halaman memuat pelanggan uji.
      await bukaDenganAuth(page, URL_PENJUALAN);
      await page.getByRole("combobox").filter({ hasText: /pilih pelanggan/i }).click();
      await page.getByPlaceholder("Cari pelanggan...").fill(uji.nomorHp);
      const pilihan = page.getByRole("option").filter({ hasText: uji.namaPelanggan });
      await expect(pilihan).toHaveCount(1, { timeout: 15_000 });
      await expect(pilihan).toContainText(uji.nomorHp);
      await pilihan.click();
      await expect(
        page.getByRole("combobox").filter({ hasText: labelPelanggan(uji) }),
      ).toBeVisible();
    } finally {
      await hapusPelangganUji(page, auth, uji.id);
    }
  });

  test("buat reservasi: pelanggan dicari lewat nomor HP, dan nomornya tampil di pilihan serta pemicu", async ({ page }) => {
    const auth = await bukaDenganAuth(page, URL_RESERVASI);
    const uji = await buatPelangganUji(page, auth);
    try {
      await bukaDenganAuth(page, URL_RESERVASI);
      await page
        .getByRole("combobox")
        .filter({ hasText: "Ketik untuk mencari pelanggan..." })
        .click();
      await page.getByPlaceholder("Cari nama pelanggan...").fill(uji.nomorHp);
      const pilihan = page.getByRole("option").filter({ hasText: uji.namaPelanggan });
      await expect(pilihan).toHaveCount(1, { timeout: 15_000 });
      await expect(pilihan).toContainText(uji.nomorHp);
      await pilihan.click();
      await expect(
        page.getByRole("combobox").filter({ hasText: labelPelanggan(uji) }),
      ).toBeVisible();
    } finally {
      await hapusPelangganUji(page, auth, uji.id);
    }
  });
});