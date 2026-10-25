import { test, expect } from "@playwright/test";
import { BASIS, bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { unik } from "../../helpers/reservasi-uji";
import { daftarAkun } from "../../helpers/akun-kas-uji";
import {
  buatPembelianUji,
  hapusPembelianUji,
  idBahanFixture,
  lokasiBertipe,
} from "../../helpers/pembelian-uji";
import { formatRupiah } from "../../../lib/format";
import { keTanggalLokal } from "../../../lib/waktu";

/*
 * Tab Belanja Stok di Keuangan: gabungan pembelian stok seluruh outlet dan
 * gudang. Halaman ini hanya membaca, sehingga pembelian uji disiapkan lewat
 * API (keputusan rancangan butir 23; alur catat lewat UI dibuktikan spec
 * catat pembelian) dan dihapus di akhir. Pengambilan ringkasan lebih dari
 * satu halaman hanya teruji di unit test (kumpulkanPembelian), karena data
 * uji di atas 100 pembelian tidak dibuat dan respons sukses palsu dilarang
 * (butir 21). Satu jalur gagal dijawab route.fulfill.
 */

const URL_BELANJA = "/dashboard/outlet/keuangan/belanjaStok";
const POLA_DAFTAR = /\/api\/pembelianstok(\?|$)/i;
const LIMIT_RINGKASAN = "100";

/** Rupiah seperti yang ditampilkan halaman (formatRupiah); spasi tak-putus diganti spasi biasa. */
const rupiah = (nilai: number) => formatRupiah(nilai).replace(/\u00a0/g, " ");
const query = (url: string) => new URL(url).searchParams;

test.describe("Keuangan: Belanja Stok", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("tab Belanja Stok membuka gabungan seluruh lokasi dengan periode bulan berjalan", async ({ page }) => {
    await page.goto("/dashboard/outlet/keuangan/akunkas");
    const tRingkasan = page.waitForRequest(
      (r) => r.method() === "GET" && POLA_DAFTAR.test(r.url()) && query(r.url()).get("limit") === LIMIT_RINGKASAN,
    );
    const tDaftar = page.waitForRequest(
      (r) => r.method() === "GET" && POLA_DAFTAR.test(r.url()) && query(r.url()).get("limit") === "10",
    );
    await page.getByRole("navigation", { name: "Navigasi Keuangan" }).getByRole("link", { name: "Belanja Stok" }).click();
    await page.waitForURL("**" + URL_BELANJA);
    const [ringkasan, daftar] = await Promise.all([tRingkasan, tDaftar]);

    const sekarang = new Date();
    const dari = keTanggalLokal(new Date(sekarang.getFullYear(), sekarang.getMonth(), 1));
    const sampai = keTanggalLokal(sekarang);
    for (const r of [ringkasan, daftar]) {
      const q = query(r.url());
      expect(q.get("dari"), "dari tanggal 1 bulan berjalan").toBe(dari);
      expect(q.get("sampai"), "sampai hari ini").toBe(sampai);
      expect(q.has("locationID"), "seluruh lokasi").toBe(false);
    }
    expect(query(ringkasan.url()).get("page"), "ringkasan mulai dari halaman 1").toBe("1");
    await expect(page.getByRole("heading", { name: "Belanja Stok", exact: true })).toBeVisible();
    await expect(page.getByText("Pembelian stok dicatat sebagai persediaan, bukan beban")).toBeVisible();
  });

  test("pembelian outlet dan gudang terhitung di kartu, terdaftar dengan lokasinya, dan dibuka di ruang asal", async ({
    page,
  }) => {
    const auth = await bukaDenganAuth(page, BASIS + URL_BELANJA);
    const outlet = await lokasiBertipe(page, auth, "Outlet");
    const gudang = await lokasiBertipe(page, auth, "Gudang");
    const bahanID = await idBahanFixture(page, auth);
    const akun = (await daftarAkun(page, auth)).find((a) => a.status === "aktif" && !a.namaAkun.startsWith("E2E"));
    test.skip(!akun, "tidak ada akun kas aktif");
    const supplier = "E2E Belanja " + unik();
    const ids: string[] = [];

    try {
      ids.push(
        await buatPembelianUji(page, auth, {
          akunKasID: akun!.id,
          supplier,
          locationID: outlet.id,
          bahanBakuID: bahanID,
          jumlah: 2,
          hargaBeli: 1500,
        }),
      );
      ids.push(
        await buatPembelianUji(page, auth, {
          akunKasID: akun!.id,
          supplier,
          locationID: gudang.id,
          bahanBakuID: bahanID,
          jumlah: 3,
          hargaBeli: 2500,
        }),
      );
      await page.reload();

      const tCari = page.waitForResponse(
        (r) =>
          r.request().method() === "GET" &&
          POLA_DAFTAR.test(r.url()) &&
          query(r.url()).get("supplier") === supplier &&
          query(r.url()).get("limit") === LIMIT_RINGKASAN,
      );
      await page.getByLabel("Cari supplier").fill(supplier);
      expect((await tCari).status(), "ringkasan dengan supplier").toBe(200);

      const ringkasan = page.getByRole("region", { name: "Ringkasan belanja stok" });
      const total = ringkasan.getByRole("region", { name: "Total belanja stok" });
      await expect(total).toContainText(rupiah(10500));
      await expect(total).toContainText("2 pembelian");
      const perLokasi = ringkasan.getByRole("region", { name: "Per lokasi penerima" });
      await expect(perLokasi.getByRole("listitem").filter({ hasText: gudang.nama })).toContainText(rupiah(7500));
      await expect(perLokasi.getByRole("listitem").filter({ hasText: outlet.nama })).toContainText(rupiah(3000));
      await expect(perLokasi.getByRole("img")).toHaveAttribute(
        "aria-label",
        `${gudang.nama} 71 persen, ${outlet.nama} 29 persen`,
      );
      const perAkun = ringkasan.getByRole("region", { name: "Per akun kas" });
      await expect(perAkun.getByRole("listitem").filter({ hasText: akun!.namaAkun })).toContainText(rupiah(10500));
      const peringkat = ringkasan.getByRole("region", { name: "Supplier dengan belanja terbesar" });
      await expect(peringkat.getByRole("listitem").filter({ hasText: supplier })).toContainText("2 pembelian");
      await expect(peringkat.getByRole("listitem").filter({ hasText: supplier })).toContainText(rupiah(10500));

      const baris = page.getByRole("row").filter({ hasText: supplier });
      await expect(baris).toHaveCount(2);
      const barisOutlet = baris.filter({ hasText: outlet.nama });
      await expect(barisOutlet).toContainText(akun!.namaAkun);
      await expect(barisOutlet).toContainText(rupiah(3000));
      await expect(
        barisOutlet.getByRole("link", { name: `Buka pembelian ${supplier} di ruang outlet` }),
      ).toHaveAttribute("href", "/dashboard/outlet/inventaris/pembelianStok/" + ids[0]);

      const tLokasi = page.waitForRequest(
        (r) =>
          r.method() === "GET" &&
          POLA_DAFTAR.test(r.url()) &&
          query(r.url()).get("locationID") === gudang.id &&
          query(r.url()).get("limit") === LIMIT_RINGKASAN,
      );
      await page.getByRole("combobox", { name: "Lokasi penerima" }).click();
      await page.getByRole("option", { name: gudang.nama, exact: true }).click();
      await tLokasi;
      await expect(baris).toHaveCount(1);
      await expect(total).toContainText(rupiah(7500));
      await expect(total).toContainText("1 pembelian");

      await baris.getByRole("link", { name: `Buka pembelian ${supplier} di ruang gudang` }).click();
      await page.waitForURL("**/dashboard/gudang/pembelianStok/" + ids[1]);
      await expect(page.getByRole("heading", { name: "Pembelian dari " + supplier })).toBeVisible();
    } finally {
      for (const id of ids) await hapusPembelianUji(page, auth, id);
    }
  });

  test("ringkasan gagal dimuat: pesan backend dan Coba Lagi tampil, daftar tetap termuat", async ({ page }) => {
    await page.route(POLA_DAFTAR, (route) =>
      route.request().method() === "GET" && query(route.request().url()).get("limit") === LIMIT_RINGKASAN
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ status: "error", message: "Ringkasan uji gagal" }),
          })
        : route.continue(),
    );
    await page.goto(URL_BELANJA);
    const galat = page.getByRole("alert").filter({ hasText: "Ringkasan uji gagal" });
    await expect(galat, "pesan tampil setelah percobaan ulang selesai").toBeVisible({ timeout: 20_000 });
    await expect(galat.getByRole("button", { name: "Coba Lagi" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Seluruh pembelian" }).getByRole("table")).toBeVisible();
  });
});