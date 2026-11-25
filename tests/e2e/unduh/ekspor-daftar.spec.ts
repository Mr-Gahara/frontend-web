import { readFileSync } from "node:fs";
import ExcelJS from "exceljs";
import { expect, test, type Download, type Page, type Response } from "@playwright/test";
import { bukaDenganAuth, login } from "../../helpers/transfer-uji";
import { bukaPanelFilter, terapkanPanelFilter } from "../../helpers/filter-uji";
import { tanpaLuberWadah } from "../../helpers/tata-letak-uji";
import { geserBulan, keBulan } from "../../../lib/unduh";
import { keTanggalLokal } from "../../../lib/waktu";

/*
 * Ekspor daftar per bulan (backend P85, B349 sampai B357; pemilik proyek,
 * 23 November 2026, "Dialog pilih bulan"): berkas dibangun backend lewat
 * ?format= dan ?bulan=, tanpa page, limit, maupun batas tanggal daftar, yang
 * ditolak backend bersama format. Respons tidak dipalsukan (keputusan
 * rancangan butir 21); bukti dari permintaan dan respons nyata. Juga filter
 * periode daftar opname dan adjustment (B356) serta unduh laba rugi.
 */

type Daftar = {
  nama: string;
  url: string;
  pola: RegExp;
  tanggal: readonly string[];
  tanpaBulan?: boolean;
  /** Baris TOTAL berisi jumlah baris di kolom kedua (totalBaris backend, AR39). */
  totalJumlahBaris?: boolean;
  /**
   * Status (kolom "Status") yang ikut dijumlah TOTAL: penjualan hanya yang
   * tersimpan, sama dengan laba rugi (penjualanController.js baris 17);
   * pengeluaran tanpa beban VOID (bebanOperasionalController.js baris 17).
   */
  statusDijumlah?: (status: string) => boolean;
};

/** CSV backend: sel berkoma atau berkutip dibungkus kutip ganda, kutip di dalam digandakan. */
function bacaCsv(teks: string): string[][] {
  const baris: string[][] = [];
  let sel = "";
  let kini: string[] = [];
  let dalamKutip = false;
  const tutupSel = () => {
    kini.push(sel);
    sel = "";
  };
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (dalamKutip) {
      if (c === '"' && teks[i + 1] === '"') {
        sel += '"';
        i++;
      } else if (c === '"') dalamKutip = false;
      else sel += c;
    } else if (c === '"') dalamKutip = true;
    else if (c === ",") tutupSel();
    else if (c === "\n") {
      tutupSel();
      baris.push(kini);
      kini = [];
    } else sel += c;
  }
  if (sel !== "" || kini.length > 0) {
    tutupSel();
    baris.push(kini);
  }
  return baris;
}

/** Lembar pertama berkas Excel backend sebagai baris sel mentah (angka tetap angka); sel kosong di ujung tidak disimpan. */
async function bacaXlsx(path: string): Promise<unknown[][]> {
  const buku = new ExcelJS.Workbook();
  await buku.xlsx.readFile(path);
  const lembar = buku.worksheets[0];
  const baris: unknown[][] = [];
  lembar.eachRow({ includeEmpty: false }, (r) => {
    baris.push((r.values as unknown[]).slice(1).map((v) => (v === undefined ? null : v)));
  });
  return baris;
}

/**
 * Isi Excel: judul kolom sama dengan CSV, setiap baris tidak lebih lebar
 * dari judul, lalu TOTAL. TOTAL menghitung baris (totalJumlahBaris), atau
 * setiap sel angka di TOTAL sama dengan jumlah kolomnya.
 */
async function periksaXlsx(d: Daftar, berkas: Download, judulCsv: string[]) {
  const isi = await bacaXlsx(await berkas.path());
  expect(isi.length, `${d.nama} xlsx: judul dan TOTAL`).toBeGreaterThanOrEqual(2);
  const [judul, ...sisa] = isi;
  const total = sisa[sisa.length - 1];
  const data = sisa.slice(0, -1);
  expect(judul.map(String), `${d.nama} xlsx: judul sama dengan CSV`).toEqual(judulCsv);
  expect(total[0], `${d.nama} xlsx: baris terakhir TOTAL`).toBe("TOTAL");
  for (const [i, b] of data.entries()) expect(b.length, `${d.nama} xlsx: lebar baris ${i + 1}`).toBeLessThanOrEqual(judul.length);
  if (d.totalJumlahBaris) {
    expect(total[1], `${d.nama} xlsx: TOTAL menghitung baris`).toBe(data.length);
    return;
  }
  const kolomStatus = judul.indexOf("Status");
  const dijumlah = data.filter((b) => !d.statusDijumlah || d.statusDijumlah(String(b[kolomStatus])));
  if (d.statusDijumlah) expect(kolomStatus, `${d.nama} xlsx: kolom Status`).toBeGreaterThan(0);
  for (const [k, nilai] of total.entries()) {
    if (k === 0 || typeof nilai !== "number") continue;
    const jumlah = dijumlah.reduce<number>((a, b) => a + (typeof b[k] === "number" ? (b[k] as number) : 0), 0);
    expect(jumlah, `${d.nama} xlsx: TOTAL kolom ${String(judul[k])}`).toBeCloseTo(nilai, 2);
  }
}

const DAFTAR: Daftar[] = [
  {
    nama: "daftar penjualan",
    url: "/dashboard/outlet/penjualan",
    pola: /\/api\/penjualan(\?|$)/i,
    tanggal: ["startDate", "endDate"],
    statusDijumlah: (s) => ["UNPAID", "PARTIAL", "PAID"].includes(s),
  },
  { nama: "mutasi kas", url: "/dashboard/outlet/keuangan/mutasiArusKas", pola: /\/api\/akunkas\/mutasi(\?|$)/i, tanggal: ["dari", "sampai"] },
  {
    nama: "pengeluaran",
    url: "/dashboard/outlet/pengeluaran",
    pola: /\/api\/bebanoperasional(\?|$)/i,
    tanggal: ["dari", "sampai"],
    statusDijumlah: (s) => s !== "VOID",
  },
  { nama: "belanja stok", url: "/dashboard/outlet/keuangan/belanjaStok", pola: /\/api\/pembelianstok(\?|$)/i, tanggal: ["dari", "sampai"] },
  { nama: "jurnal stok", url: "/dashboard/outlet/inventaris/jurnalStok", pola: /\/api\/jurnalstok(\?|$)/i, tanggal: ["dari", "sampai"], totalJumlahBaris: true },
  { nama: "stock opname", url: "/dashboard/outlet/inventaris/stockOpname", pola: /\/api\/stockopname(\?|$)/i, tanggal: ["dari", "sampai"], totalJumlahBaris: true },
  {
    nama: "stock adjustment",
    url: "/dashboard/outlet/inventaris/stockAdjustment",
    pola: /\/api\/stockopname\/adjustments(\?|$)/i,
    tanggal: ["dari", "sampai"],
    totalJumlahBaris: true,
  },
  { nama: "stok saat ini", url: "/dashboard/outlet/inventaris/stok", pola: /\/api\/inventory(\?|$)/i, tanggal: [], tanpaBulan: true, totalJumlahBaris: true },
  {
    nama: "stok gudang saat ini",
    url: "/dashboard/gudang/inventaris",
    pola: /\/api\/inventory(\?|$)/i,
    tanggal: [],
    tanpaBulan: true,
    totalJumlahBaris: true,
  },
];

const query = (r: Response) => new URL(r.url()).searchParams;

async function unduhLewatDialog(
  page: Page,
  d: Daftar,
  format: "CSV" | "Excel",
  geser = 0,
): Promise<Response & { berkas: Download }> {
  await page.getByRole("button", { name: "Unduh", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `Unduh ${d.nama}` });
  await expect(dialog).toBeVisible();
  if (d.tanpaBulan) {
    await expect(dialog.getByRole("group", { name: "Bulan" })).toHaveCount(0);
  } else {
    for (let i = 0; i < geser; i++) await dialog.getByRole("button", { name: "Bulan sebelumnya" }).click();
    // Bulan yang belum datang tidak dapat dipilih.
    if (geser === 0) await expect(dialog.getByRole("button", { name: "Bulan berikutnya" })).toBeDisabled();
  }
  await dialog.getByText(format, { exact: true }).click();
  const kode = format === "CSV" ? "csv" : "xlsx";
  const tRes = page.waitForResponse((r) => d.pola.test(r.url()) && query(r).get("format") === kode);
  const tBerkas = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Unduh", exact: true }).click();
  const res = await tRes;
  const berkas = await tBerkas;
  await expect(dialog).toBeHidden();
  return Object.assign(res, { berkas });
}

test.describe("ekspor daftar per bulan (P85)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  for (const d of DAFTAR) {
    test(`${d.nama}: dialog Unduh mengirim format dan bulan tanpa paginasi maupun batas tanggal`, async ({ page }) => {
      await bukaDenganAuth(page, d.url);
      await expect(page.getByRole("button", { name: "Unduh", exact: true })).toBeVisible({ timeout: 15_000 });

      const res = await unduhLewatDialog(page, d, "CSV");
      expect(res.status(), `${d.nama} csv`).toBe(200);
      expect(res.headers()["content-type"]).toMatch(/text\/csv/);
      const q = query(res);
      for (const k of ["page", "limit", ...d.tanggal]) expect(q.has(k), `${d.nama} tanpa ${k}`).toBe(false);
      if (d.tanpaBulan) expect(q.has("bulan")).toBe(false);
      else expect(q.get("bulan")).toBe(keBulan(new Date()));

      // Isi berkas yang diunduh: judul kolom, baris data selebar judul, lalu TOTAL.
      const isi = bacaCsv(readFileSync(await res.berkas.path(), "utf8"));
      expect(isi.length, `${d.nama}: judul dan TOTAL`).toBeGreaterThanOrEqual(2);
      const [judul, ...sisa] = isi;
      const total = sisa[sisa.length - 1];
      const data = sisa.slice(0, -1);
      expect(judul.every((k) => k.trim() !== ""), `${d.nama}: judul kolom terisi`).toBe(true);
      expect(total[0], `${d.nama}: baris terakhir TOTAL`).toBe("TOTAL");
      expect(total.length, `${d.nama}: TOTAL selebar judul`).toBe(judul.length);
      for (const [i, b] of data.entries()) expect(b.length, `${d.nama}: lebar baris ${i + 1}`).toBe(judul.length);
      if (d.totalJumlahBaris) expect(Number(total[1]), `${d.nama}: TOTAL menghitung baris`).toBe(data.length);

      // Excel: bulan lalu untuk daftar berbulan, sekarang untuk stok saat ini;
      // isinya dibaca exceljs (pemilik proyek, 25 November 2026).
      const excel = await unduhLewatDialog(page, d, "Excel", d.tanpaBulan ? 0 : 1);
      expect(excel.status(), `${d.nama} xlsx`).toBe(200);
      expect(excel.headers()["content-type"]).toMatch(/spreadsheetml/);
      if (!d.tanpaBulan) expect(query(excel).get("bulan")).toBe(keBulan(geserBulan(new Date(), -1)));
      await periksaXlsx(d, excel.berkas, judul);
    });
  }

  test("Ringkasan Laba/Rugi: Unduh laporan mengirim periode yang tampil", async ({ page }) => {
    await bukaDenganAuth(page, "/dashboard/outlet/keuangan/ringkasanLabaRugi");
    const pola = /\/api\/laporan\/laba-rugi(\?|$)/i;
    const tRes = page.waitForResponse((r) => pola.test(r.url()) && query(r).get("format") === "xlsx");
    const tBerkas = page.waitForEvent("download");
    await page.getByRole("button", { name: "Unduh laporan" }).click();
    await page.getByRole("menuitem", { name: "Excel", exact: true }).click();
    const res = await tRes;
    expect(res.status()).toBe(200);
    // Periode bawaan laman Bulanan (useState di ringkasanLabaRugi/page.tsx).
    expect(query(res).get("periode")).toBe("bulanan");
    expect(res.headers()["content-type"]).toMatch(/spreadsheetml/);
    const berkas = await tBerkas;
    expect(berkas.suggestedFilename()).toMatch(/\.xlsx$/);
    // Isi: satu baris per tanggal periode, lalu TOTAL yang menjumlah setiap kolom.
    await periksaXlsx(
      { nama: "laba rugi", url: "", pola, tanggal: [] },
      berkas,
      ["Tanggal", "Penjualan Kotor", "Penjualan Sewa", "Diskon", "Pajak", "Omzet", "HPP", "Laba Kotor", "Beban", "Laba Bersih"],
    );
  });

  for (const d of DAFTAR.filter((x) => x.nama === "stock opname" || x.nama === "stock adjustment")) {
    test(`${d.nama}: filter Periode dikirim sebagai dari dan sampai hari lokal (B356)`, async ({ page }) => {
      const tAwal = page.waitForResponse((r) => d.pola.test(r.url()) && !query(r).has("format"));
      await bukaDenganAuth(page, d.url);
      expect((await tAwal).status()).toBe(200);
      const panel = await bukaPanelFilter(page);
      await panel.getByRole("group", { name: "Periode cepat" }).getByRole("button", { name: "Bulan ini", exact: true }).click();
      const tSaring = page.waitForResponse((r) => d.pola.test(r.url()) && query(r).has("dari"));
      await terapkanPanelFilter(panel);
      const res = await tSaring;
      expect(res.status()).toBe(200);
      const hariIni = new Date();
      expect(query(res).get("dari")).toBe(keTanggalLokal(new Date(hariIni.getFullYear(), hariIni.getMonth(), 1)));
      expect(query(res).get("sampai")).toBe(keTanggalLokal(hariIni));
      await expect(page.getByRole("group", { name: "Filter aktif" })).toContainText("Bulan ini");
    });
  }

  for (const lebar of [390, 768, 1280]) {
    test(`tombol Unduh tidak meluber di ${lebar} px`, async ({ page }) => {
      await page.setViewportSize({ width: lebar, height: 900 });
      for (const d of DAFTAR) {
        await bukaDenganAuth(page, d.url);
        await expect(page.getByRole("button", { name: "Unduh", exact: true })).toBeVisible({ timeout: 15_000 });
        await tanpaLuberWadah(page, `${d.nama} ${lebar} px`);
      }
    });
  }
});
