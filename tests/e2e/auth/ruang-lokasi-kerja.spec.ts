import { test, expect } from "@playwright/test";
import { masukLokasiGudang } from "../../helpers/terkunci-uji";
import { BASIS, login } from "../../helpers/transfer-uji";

/*
 * Ruang mengikuti lokasi kerja (LK3a, modul/jadwal-shift.md): staf berlokasi
 * kerja Gudang tanpa akses-lintas-outlet hanya membuka ruang gudang. Pengguna
 * uji "E2E Lokasi Gudang" memegang seluruh izin baca Owner, sehingga ruang
 * outlet tertutup karena lokasi kerjanya, bukan karena izin.
 */

const PESAN_LUAR = "Ruang ini di luar lokasi kerja Anda.";

test.describe("Ruang mengikuti lokasi kerja", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await masukLokasiGudang(page);
  });

  test("/dashboard mengarah ke ruang gudang, dan pemilih ruang tidak menawarkan Ruang Outlet", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/gudang(\/|$)/);
    await page.getByText("Gudang Ops.").click();
    await expect(page.getByRole("menuitem", { name: /ruang gudang/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("menuitem", { name: /ruang outlet/i })).toHaveCount(0);
  });

  test("ruang outlet ditolak seluruhnya tanpa permintaan data, termasuk halaman tingkat toko", async ({ page }) => {
    const permintaanOutlet: string[] = [];
    page.on("request", (r) => {
      if (/\/api\/(location\/current|pajak|penjualan)(\?|$|\/)/.test(r.url())) permintaanOutlet.push(r.url());
    });
    for (const path of ["/dashboard/outlet", "/dashboard/outlet/pengaturan/pajak", "/dashboard/outlet/penjualan"]) {
      await page.goto(BASIS + path);
      await expect(page.getByText(PESAN_LUAR), path).toBeVisible({ timeout: 15_000 });
    }
    expect(permintaanOutlet, "halaman ruang outlet tidak dipasang").toEqual([]);
  });

  test("halaman ruang gudang tetap terbuka", async ({ page }) => {
    await page.goto(BASIS + "/dashboard/gudang/inventaris");
    await expect(page.getByText("Gudang Ops.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(PESAN_LUAR)).toHaveCount(0);
  });
});
