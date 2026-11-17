import { describe, expect, it } from "vitest";
import {
  MAKS_HARI_LAPORAN,
  NAMA_TANPA_NAMA,
  WARNA_METODE,
  busurCincin,
  formatPersen,
  jumlahHari,
  rentangMetode,
  susunMetode,
  teksRentang,
} from "@/features/laporan/pembayaran-metode";

/** Data nyata 1–17 November 2026 di basis data development (B329). */
const NOVEMBER = [
  { metodePembayaranID: "a", namaMetode: "Tunai", jumlah: 858_000, jumlahPembayaran: 26 },
  { metodePembayaranID: "b", namaMetode: "EDC BCA", jumlah: 297_000, jumlahPembayaran: 9 },
];

const SELASA = new Date(2026, 10, 17, 10, 0);

describe("rentangMetode (OM2a)", () => {
  it("Hari Ini, Minggu Ini sejak Senin, dan Bulan Ini sejak tanggal 1, seperti Ringkasan Laba/Rugi", () => {
    expect(rentangMetode("hari", SELASA).rentang).toEqual({ periode: "harian", startDate: "2026-11-17", endDate: "2026-11-17" });
    expect(rentangMetode("minggu", SELASA).rentang).toEqual({ periode: "mingguan", startDate: "2026-11-16", endDate: "2026-11-17" });
    expect(rentangMetode("bulan", SELASA).rentang).toEqual({ periode: "bulanan", startDate: "2026-11-01", endDate: "2026-11-17" });
  });

  it("Pilih tanggal mengirim dari dan sampai, termasuk satu hari, paling panjang 366 hari", () => {
    expect(rentangMetode("tanggal", SELASA, new Date(2026, 9, 28), new Date(2026, 10, 3)).rentang).toEqual({
      periode: "bulanan",
      startDate: "2026-10-28",
      endDate: "2026-11-03",
    });
    expect(rentangMetode("tanggal", SELASA, SELASA, SELASA).rentang?.startDate).toBe("2026-11-17");
    const awal = new Date(2025, 10, 17);
    expect(jumlahHari(awal, SELASA)).toBe(MAKS_HARI_LAPORAN);
    expect(rentangMetode("tanggal", SELASA, awal, SELASA).galat).toBeNull();
    expect(rentangMetode("tanggal", SELASA, new Date(2025, 10, 16), SELASA).galat).toBe("Rentang paling panjang 366 hari.");
  });

  it("Pilih tanggal yang terbalik atau kosong tidak menghasilkan rentang", () => {
    expect(rentangMetode("tanggal", SELASA, SELASA, new Date(2026, 10, 1)).rentang).toBeNull();
    expect(rentangMetode("tanggal", SELASA, undefined, SELASA).galat).toBe("Pilih tanggal dari dan sampai.");
  });
});

describe("teksRentang", () => {
  it("satu hari, satu bulan, lintas bulan, dan lintas tahun", () => {
    expect(teksRentang({ periode: "harian", startDate: "2026-11-17", endDate: "2026-11-17" })).toBe("17 November 2026");
    expect(teksRentang({ periode: "bulanan", startDate: "2026-11-01", endDate: "2026-11-17" })).toBe("1–17 November 2026");
    expect(teksRentang({ periode: "bulanan", startDate: "2026-10-28", endDate: "2026-11-03" })).toBe("28 Oktober – 3 November 2026");
    expect(teksRentang({ periode: "bulanan", startDate: "2025-12-30", endDate: "2026-01-02" })).toBe("30 Desember 2025 – 2 Januari 2026");
  });
});

describe("susunMetode", () => {
  it("total, jumlah pembayaran, porsi, dan warna berurutan seperti kanvas", () => {
    const r = susunMetode(NOVEMBER);
    expect(r.total).toBe(1_155_000);
    expect(r.jumlahPembayaran).toBe(35);
    expect(r.baris.map((b) => [b.nama, formatPersen(b.persen), b.warna])).toEqual([
      ["Tunai", "74,3%", "var(--sage)"],
      ["EDC BCA", "25,7%", "var(--navy)"],
    ]);
  });

  it("metode tanpa nama atau tanpa id tetap tampil, dan warna berulang setelah enam metode", () => {
    const tujuh = Array.from({ length: 7 }, (_, i) => ({ metodePembayaranID: null, namaMetode: i === 0 ? null : `M${i}`, jumlah: 10, jumlahPembayaran: 1 }));
    const r = susunMetode(tujuh);
    expect(r.baris[0].nama).toBe(NAMA_TANPA_NAMA);
    expect(new Set(r.baris.map((b) => b.kunci)).size).toBe(7);
    expect(r.baris[6].warna).toBe(WARNA_METODE[0]);
  });

  it("tanpa pembayaran: total 0 dan tanpa baris", () => {
    expect(susunMetode([])).toEqual({ baris: [], total: 0, jumlahPembayaran: 0 });
  });
});

describe("busurCincin", () => {
  it("busur bersambung dan genap satu keliling", () => {
    const busur = busurCincin(susunMetode(NOVEMBER).baris, 100);
    expect(busur[0]).toMatchObject({ geser: -0 });
    expect(busur[1].geser).toBeCloseTo(-busur[0].panjang);
    expect(busur[0].panjang + busur[1].panjang).toBeCloseTo(100);
  });
});
