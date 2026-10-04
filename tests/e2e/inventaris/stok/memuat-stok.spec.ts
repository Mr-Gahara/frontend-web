import { test, expect } from "@playwright/test";
import { login, BASIS } from "../../../helpers/transfer-uji";
import { cocok, tahanLaluTeruskan } from "../../../helpers/reservasi-uji";

/*
 * Selama lokasi aktif masih dimuat, query stok belum berjalan. Tabel tidak
 * boleh menyimpulkan "tidak ada data" pada saat itu. Permintaan lokasi
 * ditahan lalu diteruskan ke backend sungguhan; tidak ada respons tiruan.
 */

const URL_STOK = BASIS + "/dashboard/outlet/inventaris/stok";
const POLA_LOKASI_AKTIF = /\/api\/location\/current(\?|$)/i;
const POLA_INVENTORY = /\/api\/inventory(\?|$)/i;
const TEKS_KOSONG = "Tidak ada data stok yang ditemukan.";

test.describe("Stok outlet: keadaan memuat", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("selama lokasi dimuat, tabel tidak menampilkan daftar kosong", async ({ page }) => {
    await tahanLaluTeruskan(page, "GET", POLA_LOKASI_AKTIF, 4_000);
    const lokasiDiminta = page.waitForRequest(
      (r) => r.method() === "GET" && POLA_LOKASI_AKTIF.test(r.url()),
      { timeout: 20_000 },
    );
    await page.goto(URL_STOK, { waitUntil: "commit" });
    await lokasiDiminta;

    // Positif lebih dulu: tabelnya memang sudah tampil selagi lokasi ditahan.
    await expect(page.getByRole("columnheader", { name: "Batas Minimum" })).toBeVisible({
      timeout: 3_000,
    });
    await expect(page.getByText(TEKS_KOSONG)).toHaveCount(0, { timeout: 500 });

    const inventory = await page.waitForResponse(cocok("GET", POLA_INVENTORY), {
      timeout: 20_000,
    });
    expect(inventory.status()).toBe(200);
    await page.unroute(POLA_LOKASI_AKTIF);
  });
});