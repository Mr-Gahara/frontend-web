import { describe, expect, it } from "vitest";
import {
  jumlahkan,
  persentasePertumbuhan,
  rentangBulanIni,
  rentangPeriode,
  rentangPeriodeSebelumnya,
  teksPertumbuhan,
} from "@/features/laporan/periode";
import type { LaporanLabaRugiData } from "@/types/laporan";

/** Tahun, bulan (1-12), tanggal, jam, dan menit lokal dari teks ISO. */
function bagian(iso: string) {
  const d = new Date(iso);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
}

function baris(tanggal: string, totalLabaBersih: number, totalOmzet: number): LaporanLabaRugiData {
  return {
    tanggal,
    totalPenjualanKotor: 0,
    totalDiskon: 0,
    totalOmzet,
    totalHPP: 0,
    totalLabaKotor: 0,
    totalBebanOperasional: 0,
    totalLabaBersih,
  };
}

const RABU = new Date(2026, 8, 30, 15, 20);
const MINGGU = new Date(2026, 9, 4, 9, 0);

describe("rentangPeriode", () => {
  it("harian: awal sampai akhir hari ini", () => {
    const r = rentangPeriode("harian", RABU);
    expect(r.periode).toBe("harian");
    expect(bagian(r.startDate)).toEqual([2026, 9, 30, 0, 0]);
    expect(bagian(r.endDate)).toEqual([2026, 9, 30, 23, 59]);
  });

  it("mingguan: sejak Senin minggu ini, termasuk saat hari Minggu", () => {
    expect(bagian(rentangPeriode("mingguan", RABU).startDate)).toEqual([2026, 9, 28, 0, 0]);
    const minggu = rentangPeriode("mingguan", MINGGU);
    expect(bagian(minggu.startDate)).toEqual([2026, 9, 28, 0, 0]);
    expect(bagian(minggu.endDate)).toEqual([2026, 10, 4, 23, 59]);
  });

  it("bulanan: sejak tanggal 1 sampai akhir hari ini", () => {
    const r = rentangPeriode("bulanan", RABU);
    expect(bagian(r.startDate)).toEqual([2026, 9, 1, 0, 0]);
    expect(bagian(r.endDate)).toEqual([2026, 9, 30, 23, 59]);
  });
});

describe("rentangPeriodeSebelumnya", () => {
  it("harian: kemarin penuh, termasuk melewati pergantian tahun", () => {
    const r = rentangPeriodeSebelumnya("harian", new Date(2026, 0, 1, 10, 0));
    expect(r.periode).toBe("harian");
    expect(bagian(r.startDate)).toEqual([2025, 12, 31, 0, 0]);
    expect(bagian(r.endDate)).toEqual([2025, 12, 31, 23, 59]);
  });

  it("mingguan: Senin minggu lalu sampai hari yang sama minggu lalu", () => {
    const r = rentangPeriodeSebelumnya("mingguan", RABU);
    expect(bagian(r.startDate)).toEqual([2026, 9, 21, 0, 0]);
    expect(bagian(r.endDate)).toEqual([2026, 9, 23, 23, 59]);
  });

  it("bulanan: tanggal 1 bulan lalu sampai tanggal yang sama bulan lalu", () => {
    const r = rentangPeriodeSebelumnya("bulanan", RABU);
    expect(bagian(r.startDate)).toEqual([2026, 8, 1, 0, 0]);
    expect(bagian(r.endDate)).toEqual([2026, 8, 30, 23, 59]);
  });

  it("bulanan: tanggal dipangkas ke akhir bulan lalu yang lebih pendek", () => {
    const r = rentangPeriodeSebelumnya("bulanan", new Date(2026, 2, 31, 8, 0));
    expect(bagian(r.startDate)).toEqual([2026, 2, 1, 0, 0]);
    expect(bagian(r.endDate)).toEqual([2026, 2, 28, 23, 59]);
  });
});

describe("rentangBulanIni", () => {
  it("bulan kalender penuh berperiode bulanan", () => {
    const r = rentangBulanIni(RABU);
    expect(r.periode).toBe("bulanan");
    expect(bagian(r.startDate)).toEqual([2026, 9, 1, 0, 0]);
    expect(bagian(r.endDate)).toEqual([2026, 9, 30, 23, 59]);
  });

  it("akhir Februari mengikuti jumlah hari bulan itu", () => {
    expect(bagian(rentangBulanIni(new Date(2026, 1, 10, 12, 0)).endDate)).toEqual([2026, 2, 28, 23, 59]);
  });
});

describe("jumlahkan", () => {
  it("menjumlahkan satu kolom di seluruh baris", () => {
    const daftar = [baris("2026-09-01", 1000, 5000), baris("2026-09-02", -250, 2000)];
    expect(jumlahkan(daftar, "totalLabaBersih")).toBe(750);
    expect(jumlahkan(daftar, "totalOmzet")).toBe(7000);
    expect(jumlahkan([], "totalOmzet")).toBe(0);
  });
});

describe("persentasePertumbuhan", () => {
  it("naik terhadap periode sebelumnya", () => {
    expect(persentasePertumbuhan(150, 100)).toBe(50);
  });

  it("turun terhadap periode sebelumnya", () => {
    expect(persentasePertumbuhan(50, 100)).toBe(-50);
  });

  it("null bila periode sebelumnya 0", () => {
    expect(persentasePertumbuhan(100, 0)).toBeNull();
  });

  it("rugi yang membaik bertanda positif", () => {
    expect(persentasePertumbuhan(-50, -100)).toBe(50);
  });
});

describe("teksPertumbuhan", () => {
  it("naik dan turun dengan panah dan dua desimal", () => {
    expect(teksPertumbuhan(12.5)).toBe("↑ 12.50%");
    expect(teksPertumbuhan(-50)).toBe("↓ 50.00%");
  });

  it("tidak berubah tanpa panah", () => {
    expect(teksPertumbuhan(0)).toBe("0%");
  });

  it("tanpa pembanding menjadi tanda hubung", () => {
    expect(teksPertumbuhan(null)).toBe("-");
  });
});