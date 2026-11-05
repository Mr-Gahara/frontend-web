import { test, expect, type Page } from "@playwright/test";
import { ALASAN_TANPA_ADMIN, hapusAkunKlienUji, kredensialAdmin, wajibAdmin } from "../../helpers/admin-uji";
import { akunBaru, isiTokoDanOwner } from "../../helpers/setup-uji";

/*
 * Penyaringan per plan (butir 5, keputusan pemilik proyek 5 November 2026):
 * menu fitur di luar plan disembunyikan, URL langsung menampilkan ajakan
 * naik plan tanpa permintaan yang pasti ditolak, dan setup fitur yang belum
 * selesai tampil sebagai ajakan melengkapi setup. Akun uji baru dari API
 * admin, sampai Owner terdaftar lewat wizard, lalu dashboard dibuka.
 */
test.describe.configure({ timeout: 120_000 });

const menu = (page: Page, nama: string) => page.getByRole("button", { name: nama, exact: true });

async function keDashboard(page: Page) {
  await page.goto("/dashboard/outlet");
  await expect(page.getByRole("button", { name: "Dashboard", exact: true })).toBeVisible({ timeout: 15_000 });
}

/** Mencatat permintaan ke endpoint fitur selama blok berjalan. */
function catatPermintaan(page: Page, pola: RegExp) {
  const daftar: string[] = [];
  const catat = (r: { url(): string }) => {
    if (pola.test(r.url())) daftar.push(r.url());
  };
  page.on("request", catat);
  return { daftar, selesai: () => page.off("request", catat) };
}

test.describe("Fitur per plan", () => {
  test.skip(!kredensialAdmin(), ALASAN_TANPA_ADMIN);

  test("Basic: menu booking dan gudang tersembunyi, URL langsung menampilkan ajakan naik plan", async ({ page }) => {
    const { id } = await akunBaru(page, "plan-basic");
    try {
      await isiTokoDanOwner(page);
      await keDashboard(page);
      await expect(menu(page, "Sesi Booking & Reservasi")).toHaveCount(0);
      await expect(menu(page, "Suplai Gudang")).toBeVisible();
      await menu(page, "Suplai Gudang").click();
      await expect(page.getByRole("link", { name: "Pembelian Stok", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Pengajuan Barang", exact: true })).toHaveCount(0);
      await expect(page.getByText("Status Venue")).toHaveCount(0);
      await expect(page.getByText(/Setup .* belum selesai/)).toHaveCount(0);

      const fitur = catatPermintaan(page, /\/api\/(sesibooking|aset|tarif|tipeaset|pengajuanstok|transferstok|dashboard\/gudang)/);
      await page.goto("/dashboard/outlet/reservasi");
      await expect(page.getByText("Sesi Booking belum termasuk plan Anda")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("tersedia mulai plan Advanced. Toko Anda memakai plan Basic.")).toBeVisible();
      await expect(page.getByRole("link", { name: "Lihat Langganan" })).toHaveAttribute(
        "href",
        "/dashboard/outlet/pengaturan/langganan",
      );
      await page.goto("/dashboard/gudang");
      await expect(page.getByText("Gudang belum termasuk plan Anda")).toBeVisible({ timeout: 15_000 });
      await page.goto("/dashboard/outlet/inventaris/pengajuanStok");
      await expect(page.getByText("Gudang belum termasuk plan Anda")).toBeVisible({ timeout: 15_000 });
      fitur.selesai();
      expect(fitur.daftar, "tidak ada permintaan yang pasti ditolak 403").toEqual([]);
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });

  test("Advanced: booking tampil, gudang tersembunyi, dan setup booking yang belum selesai mengajak ke /setup", async ({
    page,
  }) => {
    const { id } = await akunBaru(page, "plan-advanced", { plan: "advanced", durasiBulan: 1 });
    try {
      await isiTokoDanOwner(page);
      await keDashboard(page);
      await expect(menu(page, "Sesi Booking & Reservasi")).toBeVisible();
      await expect(page.getByText("Setup Sesi Booking belum selesai, sehingga fiturnya masih terkunci.")).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText("Status Venue")).toBeVisible();
      await expect(page.getByRole("link", { name: "Lengkapi setup" }).first()).toHaveAttribute("href", "/setup");

      await menu(page, "Sesi Booking & Reservasi").click();
      await page.waitForURL("**/dashboard/outlet/reservasi");
      await expect(page.getByText("Setup Sesi Booking belum selesai")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Gagal memuat data. Periksa koneksi atau coba lagi.")).toHaveCount(0);

      await page.goto("/dashboard/outlet/inventaris/penerimaanBarang");
      await expect(page.getByText("tersedia mulai plan Pro. Toko Anda memakai plan Advanced.")).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });

  test("Pro tanpa gudang: halaman Suplai Gudang outlet mengajak melengkapi setup gudang", async ({ page }) => {
    const { id } = await akunBaru(page, "plan-pro", { plan: "pro", durasiBulan: 1 });
    try {
      await isiTokoDanOwner(page);
      await keDashboard(page);
      await expect(page.getByText("Setup Sesi Booking dan Gudang belum selesai, sehingga fiturnya masih terkunci.")).toBeVisible({
        timeout: 15_000,
      });
      await page.goto("/dashboard/outlet/inventaris/pengajuanStok");
      await expect(page.getByText("Setup Gudang belum selesai")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByRole("link", { name: "Lengkapi setup" })).toHaveAttribute("href", "/setup");
    } finally {
      await hapusAkunKlienUji(id, wajibAdmin());
    }
  });
});
