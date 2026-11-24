import { test, expect, type Page, type Response } from "@playwright/test";
import { masuk } from "../../helpers/masuk-uji";

/*
 * Navigasi halaman berikutnya pada daftar berhalaman server (B105, B106,
 * B108; keputusan rancangan butir 27). Sebelumnya hanya jurnal stok yang
 * menguji tombol Next; empat daftar lain hanya menguji halaman pertama.
 * Halaman 2 harus diminta ke server dengan query yang sama kecuali page,
 * dan tabel menampilkan baris halaman 2, bukan halaman 1.
 */

const BASIS = "http://localhost:3000";
const UKURAN = 10;

type Daftar = { nama: string; url: string; pola: RegExp; nomor: string };

const DAFTAR: Daftar[] = [
  {
    nama: "stock adjustment outlet",
    url: "/dashboard/outlet/inventaris/stockAdjustment",
    pola: /\/api\/stockopname\/adjustments(\?|$)/,
    nomor: "nomorAdjustment",
  },
  { nama: "stock opname outlet", url: "/dashboard/outlet/inventaris/stockOpname", pola: /\/api\/stockopname(\?|$)/, nomor: "nomorOpname" },
  { nama: "surat jalan gudang", url: "/dashboard/gudang/transferStok", pola: /\/api\/transferstok(\?|$)/i, nomor: "nomorTransfer" },
  { nama: "pengajuan stok outlet", url: "/dashboard/outlet/inventaris/pengajuanStok", pola: /\/api\/pengajuanstok(\?|$)/i, nomor: "nomorPengajuan" },
];

type Halaman = { query: URLSearchParams; nomor: string[]; total: number };

const daftarGet = (pola: RegExp, syarat: (q: URLSearchParams) => boolean) => (r: Response) =>
  r.request().method() === "GET" && pola.test(r.url()) && syarat(new URL(r.url()).searchParams);

async function baca(r: Response, kunci: string): Promise<Halaman> {
  expect(r.status()).toBe(200);
  const body = (await r.json()) as { data: Record<string, unknown>[]; pagination?: { total: number } };
  expect(body.pagination, "daftar berhalaman memuat pagination").toBeTruthy();
  return {
    query: new URL(r.url()).searchParams,
    nomor: body.data.map((d) => String(d[kunci])),
    total: body.pagination!.total,
  };
}

/** Query halaman lain sama dengan halaman pertama kecuali page. */
function tanpaHalaman(q: URLSearchParams) {
  const salin = new URLSearchParams(q);
  salin.delete("page");
  salin.sort();
  return salin.toString();
}

async function buka(page: Page, d: Daftar) {
  await page.goto(BASIS + d.url, { waitUntil: "commit" });
  return baca(
    await page.waitForResponse(daftarGet(d.pola, (q) => q.get("page") === "1" && q.get("limit") === String(UKURAN))),
    d.nomor,
  );
}

test.describe("Halaman berikutnya daftar berhalaman server", () => {
  test.beforeEach(async ({ page }) => {
    await masuk(page);
  });

  for (const d of DAFTAR) {
    test(`${d.nama}: Next meminta halaman 2 dengan query yang sama, dan tabel berganti isi`, async ({ page }) => {
      const satu = await buka(page, d);
      test.skip(satu.total <= UKURAN, `${d.nama} belum lebih dari satu halaman`);
      const jumlahHalaman = Math.ceil(satu.total / UKURAN);
      const baris = page.locator("table tbody tr");
      await expect(baris.first()).toContainText(satu.nomor[0]);
      await expect(page.getByText(`Halaman 1 dari ${jumlahHalaman}`, { exact: true })).toBeVisible();

      const t2 = page.waitForResponse(daftarGet(d.pola, (q) => q.get("page") === "2"));
      await page.getByRole("button", { name: "Next", exact: true }).click();
      const dua = await baca(await t2, d.nomor);
      expect(tanpaHalaman(dua.query), "filter, ruang, dan ukuran tetap").toBe(tanpaHalaman(satu.query));
      expect(dua.nomor.length).toBeGreaterThan(0);
      expect(dua.nomor.some((n) => satu.nomor.includes(n)), "halaman 2 tidak mengulang halaman 1").toBe(false);

      await expect(page.getByText(`Halaman 2 dari ${jumlahHalaman}`, { exact: true })).toBeVisible();
      await expect(baris).toHaveCount(dua.nomor.length);
      await expect(baris.first()).toContainText(dua.nomor[0]);
      await expect(baris.filter({ hasText: satu.nomor[0] })).toHaveCount(0);
    });
  }
});
