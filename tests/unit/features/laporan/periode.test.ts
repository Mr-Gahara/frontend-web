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

function baris(tanggal: string, totalLabaBersih: number, totalOmzet: number): LaporanLabaRugiData {
  return {
    tanggal,
    totalPenjualanKotor: 0,
    totalPenjualanSewa: 0,
    totalDiskon: 0,
    totalPajak: 0,
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
  it("harian: hari ini sebagai startDate dan endDate", () => {
    expect(rentangPeriode("harian", RABU)).toEqual({
      periode: "harian",
      startDate: "2026-09-30",
      endDate: "2026-09-30",
    });
  });

  it("mingguan: sejak Senin minggu ini, termasuk saat hari Minggu", () => {
    expect(rentangPeriode("mingguan", RABU).startDate).toBe("2026-09-28");
    expect(rentangPeriode("mingguan", MINGGU)).toEqual({
      periode: "mingguan",
      startDate: "2026-09-28",
      endDate: "2026-10-04",
    });
  });

  it("bulanan: sejak tanggal 1 sampai hari ini", () => {
    expect(rentangPeriode("bulanan", RABU)).toEqual({
      periode: "bulanan",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
  });

  it("tanggal dibentuk dari hari lokal, bukan dari UTC", () => {
    const r = rentangPeriode("harian", new Date(2026, 8, 30, 0, 30));
    expect(r.startDate).toBe("2026-09-30");
    expect(r.endDate).toBe("2026-09-30");
  });
});

describe("rentangPeriodeSebelumnya", () => {
  it("harian: kemarin sebagai satu hari, termasuk melewati pergantian tahun", () => {
    expect(rentangPeriodeSebelumnya("harian", new Date(2026, 0, 1, 10, 0))).toEqual({
      periode: "harian",
      startDate: "2025-12-31",
      endDate: "2025-12-31",
    });
  });

  it("mingguan: Senin minggu lalu sampai hari yang sama minggu lalu", () => {
    const r = rentangPeriodeSebelumnya("mingguan", RABU);
    expect(r.startDate).toBe("2026-09-21");
    expect(r.endDate).toBe("2026-09-23");
  });

  it("bulanan: tanggal 1 bulan lalu sampai tanggal yang sama bulan lalu", () => {
    const r = rentangPeriodeSebelumnya("bulanan", RABU);
    expect(r.startDate).toBe("2026-08-01");
    expect(r.endDate).toBe("2026-08-30");
  });

  it("bulanan: tanggal dipangkas ke akhir bulan lalu yang lebih pendek", () => {
    const r = rentangPeriodeSebelumnya("bulanan", new Date(2026, 2, 31, 8, 0));
    expect(r.startDate).toBe("2026-02-01");
    expect(r.endDate).toBe("2026-02-28");
  });
});

describe("rentangBulanIni", () => {
  it("bulan kalender penuh berperiode bulanan", () => {
    expect(rentangBulanIni(RABU)).toEqual({
      periode: "bulanan",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    });
  });

  it("akhir Februari mengikuti jumlah hari bulan itu", () => {
    expect(rentangBulanIni(new Date(2026, 1, 10, 12, 0)).endDate).toBe("2026-02-28");
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