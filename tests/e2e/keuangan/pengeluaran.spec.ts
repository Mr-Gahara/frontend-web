import { expect, test, type Request } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";

/*
 * Halaman pengeluaran menunggu backend: /bebanoperasional dan /kategoribeban
 * menjawab 403 bagi setiap pengguna di backend `50eede7`, karena izinnya
 * tidak ada di seed. Sampai itu halaman hanya menampilkan keterangan belum
 * tersedia dan tidak memanggil kedua endpoint (pemilik proyek, 4 Oktober
 * 2026). Skenario ini diganti saat halaman pengeluaran dibangun.
 */

const URL_PENGELUARAN = "/dashboard/outlet/pengeluaran";
const POLA_BEBAN = /\/api\/(bebanoperasional|kategoribeban)/i;

test.describe("E2E — Pengeluaran", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("pengeluaran menampilkan keterangan belum tersedia tanpa memanggil endpoint beban", async ({ page }) => {
    let permintaanBeban = 0;
    const hitung = (permintaan: Request) => {
      if (POLA_BEBAN.test(permintaan.url())) permintaanBeban++;
    };
    page.on("request", hitung);

    await page.goto(URL_PENGELUARAN);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: "Pengeluaran", exact: true })).toBeVisible();
    await expect(main.getByText("Pengeluaran belum tersedia")).toBeVisible();
    await expect(main.getByText("Pengeluaran Page")).toHaveCount(0);

    page.off("request", hitung);
    expect(permintaanBeban).toBe(0);
  });
});