import { test, expect, type Page } from "@playwright/test";
import { BASIS, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import {
  NAMA_BAHAN,
  NAMA_PRODUK,
  TAKARAN,
  batalkanPenjualanUji,
  buatDraftLewatUi,
  detailPenjualan,
  siapkanFixture,
} from "../../helpers/penjualan-uji";

/**
 * Kartu Stok Keluar di detail penjualan (VD3a, desain A pemilik proyek
 * 12 November 2026): kosong saat DRAFT, berisi rincianStok (backend P78,
 * B320) setelah disimpan, dan tetap ada setelah VOID dengan catatannya.
 * Menulis data sungguhan: satu penjualan uji yang berakhir VOID.
 */
const DAFTAR = BASIS + "/dashboard/outlet/penjualan";
const polaPenjualan = (id: string) => new RegExp(`/api/penjualan/${id}(\\?|$)`, "i");

const kartu = (page: Page) => page.getByRole("region", { name: "Stok Keluar" });

test.describe("Stok keluar di detail penjualan", () => {
  test.setTimeout(150_000);

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("DRAFT belum memotong stok, tersimpan menampilkan bahan per produk, dan VOID tetap menampilkannya", async ({ page }) => {
    const auth = await bukaDenganAuth(page, DAFTAR);
    const JUMLAH = 3;
    await siapkanFixture(page, auth, 20);
    const penjualan = await buatDraftLewatUi(page, JUMLAH);
    try {
      await test.step("DRAFT: stok belum dipotong", async () => {
        await page.goto(`${DAFTAR}/${penjualan.id}`);
        await expect(kartu(page)).toContainText("Stok belum dipotong. Rinciannya muncul setelah penjualan disimpan.");
        await expect(kartu(page).getByRole("listitem")).toHaveCount(0);
      });

      await test.step("tersimpan: bahan resep di bawah produknya", async () => {
        await page.getByRole("button", { name: /finalisasi invoice/i }).click();
        const tunggu = page.waitForResponse(
          (r) => r.request().method() === "PUT" && polaPenjualan(penjualan.id).test(r.url()),
        );
        await page.getByRole("button", { name: /ya, finalisasi transaksi/i }).click();
        expect((await tunggu).status()).toBe(200);

        const k = kartu(page);
        await expect(k.getByRole("heading", { name: `${NAMA_PRODUK} × ${JUMLAH}` })).toBeVisible();
        const baris = k.getByRole("listitem").filter({ hasText: NAMA_BAHAN });
        await expect(baris).toHaveCount(1);
        await expect(baris).toContainText("Bahan baku");
        await expect(baris).toContainText(`${JUMLAH * TAKARAN} pcs`);
        // Nama outlet tenant terbaca Owner (read-location).
        await expect(k).toContainText(/Dipotong dari .+ saat penjualan disimpan\./);
        await expect(k).not.toContainText("di-VOID");
      });

      await test.step("VOID: rincian tetap, dengan catatan stok tidak dikembalikan", async () => {
        await page.getByRole("button", { name: /void penjualan/i }).click();
        const tunggu = page.waitForResponse(
          (r) => r.request().method() === "PUT" && polaPenjualan(penjualan.id).test(r.url()),
        );
        await page.getByRole("alertdialog").getByRole("button", { name: /ya, void penjualan/i }).click();
        expect((await tunggu).status()).toBe(200);

        const k = kartu(page);
        await expect(k).toContainText("Penjualan ini di-VOID. Stok di bawah tetap keluar dan tidak dikembalikan.");
        await expect(k.getByRole("listitem").filter({ hasText: NAMA_BAHAN })).toContainText(`${JUMLAH * TAKARAN} pcs`);
        expect((await detailPenjualan(page, auth, penjualan.id)).statusPenjualan).toBe("VOID");
      });

      await test.step("HP 390 px: kartu tidak meluber", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        const k = kartu(page);
        await expect(k.getByText(`${JUMLAH * TAKARAN} pcs`)).toBeVisible();
        const lebar = await k.evaluate((el) => ({ isi: el.scrollWidth, kotak: el.clientWidth }));
        expect(lebar.isi, "isi kartu tidak lebih lebar dari kartunya").toBeLessThanOrEqual(lebar.kotak);
        const kanan = await k.evaluate((el) => el.getBoundingClientRect().right);
        expect(kanan).toBeLessThanOrEqual(390);
      });
    } finally {
      await batalkanPenjualanUji(page, auth, penjualan.id);
    }
  });
});
