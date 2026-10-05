import { test, expect } from "@playwright/test";
import { BASIS } from "../../helpers/transfer-uji";

/*
 * Guard sesi dashboard hanya dipasang di app/dashboard/layout.tsx.
 * Halaman dan komponen di bawahnya tidak memanggil useAuthGuard sendiri,
 * sehingga setiap rute di bawah /dashboard harus tetap dialihkan ke login
 * saat sesi tidak ada. Rute di bawah mewakili halaman di app/, rute
 * berparameter, dan halaman yang isinya berasal dari features/.
 */
const ID_TIDAK_ADA = "000000000000000000000000";

const RUTE = [
  { nama: "daftar produk", path: "/dashboard/outlet/inventaris/produk" },
  {
    nama: "ubah tarif (rute berparameter)",
    path: `/dashboard/outlet/reservasi/tarif/${ID_TIDAK_ADA}/edit`,
  },
  {
    nama: "Pindah Dana (halaman dari features)",
    path: "/dashboard/outlet/keuangan/akunkas/pindahDana",
  },
  {
    nama: "daftar stock opname gudang (halaman dari features)",
    path: "/dashboard/gudang/stockOpname",
  },
];

test.describe("Guard dashboard tanpa sesi", () => {
  for (const { nama, path } of RUTE) {
    test(`${nama} dialihkan ke login`, async ({ page }) => {
      await page.goto(BASIS + path);
      await page.waitForURL(/\/login$/, { timeout: 20_000 });
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});