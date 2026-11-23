import { expect, test, type Page } from "@playwright/test";
import { api, BASIS, bukaDenganAuth, login, siapkanSuratJalan, tutupSuratJalanUji, type Auth } from "../../helpers/transfer-uji";
import { ID_TIDAK_ADA } from "../../helpers/reservasi-uji";

/*
 * Tombol Kembali, Batal, dan Batalkan membuka tujuan yang pasti, bukan
 * router.back() (pemilik proyek, 23 November 2026). router.back() bergantung
 * riwayat browser: laman yang dibuka langsung (tautan, tab baru) tidak
 * kembali ke tempat yang dimaksud, dan itulah penyebab gagal sesekali
 * "Batalkan kembali ke daftar" di suite penuh. Setiap laman di sini dibuka
 * di tab baru tanpa riwayat.
 */

async function bukaTabBaru(page: Page, url: string): Promise<Page> {
  const tab = await page.context().newPage();
  await tab.goto(BASIS + url);
  return tab;
}

async function klikLaluTunggu(tab: Page, nama: string | RegExp, tujuan: string) {
  await tab.getByRole("button", { name: nama }).first().click();
  await tab.waitForURL((u) => u.pathname === tujuan, { timeout: 15_000 });
}

test.describe("tombol kembali bertujuan pasti", () => {
  let auth: Auth;
  test.beforeEach(async ({ page }) => {
    await login(page);
    auth = await bukaDenganAuth(page, "/dashboard/outlet");
  });

  test("Buat Reservasi: Kembali dan Batalkan ke daftar reservasi", async ({ page }) => {
    for (const nama of ["Kembali", "Batalkan"]) {
      const tab = await bukaTabBaru(page, "/dashboard/outlet/reservasi/buatReservasi");
      await expect(tab.getByText("Buat Sesi Booking (Reservasi)")).toBeVisible({ timeout: 15_000 });
      await klikLaluTunggu(tab, nama === "Kembali" ? /^Kembali$/ : "Batalkan", "/dashboard/outlet/reservasi");
      await tab.close();
    }
  });

  test("Buat Pengajuan: Kembali ke Daftar Pengajuan dan Batal ke daftar pengajuan", async ({ page }) => {
    for (const nama of ["Kembali ke Daftar Pengajuan", "Batal"]) {
      const tab = await bukaTabBaru(page, "/dashboard/outlet/inventaris/pengajuanStok/buatPengajuan");
      await expect(tab.getByRole("button", { name: "Simpan sebagai Draft" })).toBeVisible({ timeout: 15_000 });
      await klikLaluTunggu(tab, new RegExp(`^${nama}$`), "/dashboard/outlet/inventaris/pengajuanStok");
      await tab.close();
    }
  });

  test("surat jalan dan penerimaan yang tidak ada: Kembali ke daftarnya", async ({ page }) => {
    const kasus = [
      ["/dashboard/gudang/transferStok/" + ID_TIDAK_ADA, "/dashboard/gudang/transferStok"],
      ["/dashboard/gudang/transferStok/" + ID_TIDAK_ADA + "/edit", "/dashboard/gudang/transferStok"],
      ["/dashboard/outlet/inventaris/penerimaanBarang/" + ID_TIDAK_ADA, "/dashboard/outlet/inventaris/penerimaanBarang"],
    ] as const;
    for (const [url, tujuan] of kasus) {
      const tab = await bukaTabBaru(page, url);
      await expect(tab.getByRole("button", { name: /^Kembali$/ })).toBeVisible({ timeout: 20_000 });
      await klikLaluTunggu(tab, /^Kembali$/, tujuan);
      await tab.close();
    }
  });

  test("Batal Revisi surat jalan PENDING kembali ke detail surat jalannya", async ({ page }) => {
    // Surat jalan PENDING disiapkan lewat API (milik alur pengajuan, keputusan rancangan butir 23) dan dibatalkan di finally.
    const sj = await siapkanSuratJalan(page, auth, { kirim: false });
    const id = (sj as { id?: string; _id?: string }).id ?? (sj as { _id?: string })._id!;
    try {
      const tab = await bukaTabBaru(page, `/dashboard/gudang/transferStok/${id}/edit`);
      await expect(tab.getByRole("button", { name: /Batal Revisi/ })).toBeVisible({ timeout: 20_000 });
      await klikLaluTunggu(tab, /Batal Revisi/, `/dashboard/gudang/transferStok/${id}`);
      await tab.close();
    } finally {
      // Tab baru memutar token sesi; token diambil ulang sebelum membersihkan.
      auth = await bukaDenganAuth(page, "/dashboard/outlet");
      await tutupSuratJalanUji(page, auth, id);
    }
  });

  test("Pembayaran penjualan: Kembali ke detail penjualannya", async ({ page }) => {
    const daftar = await api<{ id: string; statusPenjualan: string; sisaTagihan: number }[]>(
      page,
      auth,
      "GET",
      "/penjualan?limit=50",
    );
    const belumLunas = (daftar.data ?? []).find((p) => p.statusPenjualan !== "VOID" && p.statusPenjualan !== "DRAFT" && p.sisaTagihan > 0);
    test.skip(!belumLunas, "tidak ada penjualan bersisa tagihan di 50 penjualan terbaru");
    const tab = await bukaTabBaru(page, `/dashboard/outlet/penjualan/${belumLunas!.id}/pembayaran`);
    await expect(tab.getByRole("button", { name: /^Kembali$/ })).toBeVisible({ timeout: 20_000 });
    await klikLaluTunggu(tab, /^Kembali$/, `/dashboard/outlet/penjualan/${belumLunas!.id}`);
    await tab.close();
  });
});
