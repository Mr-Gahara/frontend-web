import { expect, test, type Page, type Response } from "@playwright/test";
import { login } from "../../helpers/transfer-uji";
import { awalHari } from "../../../features/akun-kas/mutasi";
import { rentangPeriode } from "../../../features/laporan/periode";
import { formatRupiah } from "../../../lib/format";

/*
 * Spec dashboard outlet (keputusan DB1a sampai DB6a). Baca-saja: tidak ada
 * data yang ditulis dan tidak ada respons yang dipalsukan (keputusan
 * rancangan butir 21). Setiap harapan dihitung dari respons yang dibaca
 * halaman itu sendiri; penunggu dipasang setelah goto ber-waitUntil commit.
 */

const URL_DASHBOARD = "/dashboard/outlet";

/** Rupiah seperti yang ditampilkan halaman; spasi tak-putus diganti spasi biasa. */
const rupiah = (nilai: number) => formatRupiah(nilai).replace(/\u00a0/g, " ");

const param = (r: Response, nama: string) => new URL(r.url()).searchParams.get(nama);

const get = (r: Response, pola: RegExp) =>
  r.request().method() === "GET" && pola.test(new URL(r.url()).pathname);

const isi = async <T>(r: Response): Promise<T> => ((await r.json()) as { data: T }).data;

const jumlah = (daftar: Record<string, unknown>[], kolom: string) =>
  daftar.reduce((total, baris) => total + (Number(baris[kolom]) || 0), 0);

const panel = (page: Page, nama: string) => page.getByRole("region", { name: nama, exact: true });

type StafMonitoring = { penggunaID: string };

/** Membuka dashboard dan mengembalikan staf ruang outlet menurut kedua respons halaman. */
async function bukaDanBacaStaf(page: Page): Promise<number> {
  await page.goto(URL_DASHBOARD, { waitUntil: "commit" });
  const [rMonitoring, rPengguna] = await Promise.all([
    page.waitForResponse((r) => get(r, /\/api\/absensi\/monitoring$/i)),
    page.waitForResponse((r) => get(r, /\/api\/pengguna$/i)),
  ]);
  expect(rMonitoring.status(), "monitoring absensi").toBe(200);
  expect(rPengguna.status(), "daftar pengguna").toBe(200);
  const monitoring = await isi<{ daftar: StafMonitoring[] }>(rMonitoring);
  const pengguna = await isi<{ id?: string; _id?: string }[]>(rPengguna);
  const idRuang = new Set(pengguna.map((p) => String(p.id ?? p._id)));
  return monitoring.daftar.filter((s) => idRuang.has(String(s.penggunaID))).length;
}

test.describe("Dashboard outlet", () => {
  test("kartu dan grafik menampilkan angka dari respons", async ({ page }) => {
    await login(page);
    const hariIni = new Date();
    const harian = rentangPeriode("harian", hariIni);
    const bulanan = rentangPeriode("bulanan", hariIni);

    await page.goto(URL_DASHBOARD, { waitUntil: "commit" });
    const [rTransaksi, rHarian, rBulanan] = await Promise.all([
      page.waitForResponse(
        (r) =>
          get(r, /\/api\/penjualan$/i) &&
          param(r, "statusPenjualan") === "PAID" &&
          param(r, "startDate") === awalHari(hariIni).toISOString(),
      ),
      page.waitForResponse(
        (r) =>
          get(r, /\/api\/laporan\/laba-rugi$/i) &&
          param(r, "periode") === "harian" &&
          param(r, "startDate") === harian.startDate,
      ),
      page.waitForResponse(
        (r) =>
          get(r, /\/api\/laporan\/laba-rugi$/i) &&
          param(r, "periode") === "bulanan" &&
          param(r, "startDate") === bulanan.startDate &&
          param(r, "endDate") === bulanan.endDate,
      ),
    ]);

    expect(rTransaksi.status(), "transaksi lunas hari ini").toBe(200);
    expect(param(rTransaksi, "page")).toBe("1");
    expect(param(rTransaksi, "limit")).toBe("10");
    const total = ((await rTransaksi.json()) as { pagination?: { total?: number } }).pagination?.total;
    expect(typeof total, "pagination.total dikirim backend").toBe("number");
    await expect(panel(page, "Transaksi Hari Ini")).toContainText(`${total} transaksi`);

    expect(rHarian.status(), "laba rugi hari ini").toBe(200);
    const omzetHariIni = jumlah(await isi<Record<string, unknown>[]>(rHarian), "totalOmzet");
    await expect(panel(page, "Omzet Hari Ini")).toContainText(rupiah(omzetHariIni));

    expect(rBulanan.status(), "laba rugi bulan ini").toBe(200);
    const omzetBulanIni = jumlah(await isi<Record<string, unknown>[]>(rBulanan), "totalOmzet");
    await expect(panel(page, "Pendapatan Bulan Ini")).toContainText(rupiah(omzetBulanIni));

    await expect(panel(page, "Laba Bersih (Kemarin)")).toBeVisible();
    await expect(panel(page, "HPP (Kemarin)")).toBeVisible();
  });

  test("status venue menampilkan petak sesuai daftar aset", async ({ page }) => {
    await login(page);
    await page.goto(URL_DASHBOARD, { waitUntil: "commit" });
    const rAset = await page.waitForResponse((r) => get(r, /\/api\/aset$/i));
    expect(rAset.status(), "daftar aset").toBe(200);
    const aset = await isi<{ status: string }[]>(rAset);
    const venue = panel(page, "Status Venue");

    if (aset.length === 0) {
      await expect(venue).toContainText("Belum ada aset.");
      return;
    }
    const dipakai = aset.filter((a) => a.status === "digunakan").length;
    await expect(venue).toContainText(`${dipakai} dari ${aset.length} dipakai`);
    await expect(venue.getByRole("listitem")).toHaveCount(Math.min(aset.length, 10));
    if (aset.length > 10) {
      await expect(venue).toContainText(`Menampilkan 10 dari ${aset.length} aset.`);
    }
  });

  test("status staf memuat staf ruang outlet, dan lonceng nonaktif", async ({ page }) => {
    await login(page);
    const jumlahStaf = await bukaDanBacaStaf(page);
    test.skip(jumlahStaf === 0, "tidak ada staf ruang outlet di monitoring absensi");

    const staf = panel(page, "Status Staf");
    await expect(staf).toContainText(`dari ${jumlahStaf} sudah absen`);
    // Satu baris kepala ditambah satu baris per staf; di lebar desktop tidak ada yang disembunyikan.
    await expect(staf.getByRole("row")).toHaveCount(jumlahStaf + 1);
    await expect(staf.getByRole("button", { name: /tampilkan semua/i })).toHaveCount(0);

    await expect(page.getByRole("button", { name: "Notifikasi belum tersedia" })).toBeDisabled();
  });

  test("di lebar HP daftar staf dibatasi lima baris sampai Tampilkan semua ditekan", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const jumlahStaf = await bukaDanBacaStaf(page);
    test.skip(jumlahStaf <= 5, "staf ruang outlet tidak lebih dari lima, tombol tidak tampil");

    const staf = panel(page, "Status Staf");
    // Kepala tabel disembunyikan di HP, sehingga yang terhitung hanya baris staf.
    await expect(staf.getByRole("row")).toHaveCount(5);
    await staf.getByRole("button", { name: `Tampilkan semua (${jumlahStaf})` }).click();
    await expect(staf.getByRole("row")).toHaveCount(jumlahStaf);
  });
});