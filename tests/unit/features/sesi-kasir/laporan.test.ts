import { describe, expect, it } from "vitest";
import {
  FILTER_PERIODE_KOSONG,
  angkaStruk,
  judulLaporan,
  jumlahFilterPeriode,
  paramsDaftarPeriode,
  pilFilterPeriode,
  subjudulLaporan,
  teksSesiPeriode,
  urlLaporanPeriode,
  waktuBaris,
  waktuStruk,
} from "@/features/sesi-kasir/laporan";

/** Waktu lokal sebagai ISO, agar test tidak bergantung zona waktu mesin. */
const lokal = (bulan: number, tanggal: number, jam: number, menit: number) =>
  new Date(2026, bulan - 1, tanggal, jam, menit).toISOString();

describe("laporan tutup kasir: filter dan parameter (PW10)", () => {
  it("tanpa filter: hanya halaman dan ukuran", () => {
    expect(paramsDaftarPeriode(FILTER_PERIODE_KOSONG, 1, 10)).toEqual({ page: "1", limit: "10" });
    expect(jumlahFilterPeriode(FILTER_PERIODE_KOSONG)).toBe(0);
    expect(pilFilterPeriode(FILTER_PERIODE_KOSONG, new Date(2026, 10, 27), () => {})).toEqual([]);
  });

  it("periode dibuka dikirim sebagai tanggal lokal YYYY-MM-DD dan dihitung satu filter", () => {
    const filter = { dari: new Date(2026, 10, 1), sampai: new Date(2026, 10, 27) };
    expect(paramsDaftarPeriode(filter, 2, 20)).toEqual({ page: "2", limit: "20", dari: "2026-11-01", sampai: "2026-11-27" });
    expect(jumlahFilterPeriode(filter)).toBe(1);
    let diterapkan: unknown;
    const [pil] = pilFilterPeriode(filter, new Date(2026, 10, 27), (baru) => (diterapkan = baru));
    expect(pil.label.startsWith("Dibuka ")).toBe(true);
    pil.onHapus();
    expect(diterapkan).toEqual(FILTER_PERIODE_KOSONG);
  });
});

describe("laporan tutup kasir: teks (PW10)", () => {
  it("sesi periode: jumlah sesi, ditambah yang masih buka selama berjalan", () => {
    expect(teksSesiPeriode({ status: "TUTUP", jumlahSesi: 2, sesiBuka: 0 })).toBe("2 sesi");
    expect(teksSesiPeriode({ status: "BUKA", jumlahSesi: 2, sesiBuka: 1 })).toBe("2 sesi · 1 masih buka");
    expect(teksSesiPeriode({ status: "BUKA", jumlahSesi: 1, sesiBuka: 0 })).toBe("1 sesi");
  });

  it("waktu baris, judul, dan subjudul memakai waktu lokal", () => {
    expect(waktuBaris(lokal(11, 27, 13, 2))).toBe("Jum 27 Nov 2026, 13.02");
    expect(judulLaporan(lokal(11, 24, 8, 0))).toBe("Laporan Tutup Kasir, Selasa 24 November 2026");
    const p = { dibukaPada: lokal(11, 24, 8, 0), ditutupPada: lokal(11, 24, 16, 5), jumlahSesi: 2 };
    expect(subjudulLaporan(p, "Outlet Gajah Mada")).toBe("08.00 sampai 16.05 · 2 sesi kasir · Outlet Gajah Mada");
    expect(subjudulLaporan({ ...p, ditutupPada: null }, null)).toBe("08.00 sampai sekarang · 2 sesi kasir");
  });

  it("angka dan waktu struk seperti kertas, tanpa Rp", () => {
    expect(angkaStruk(1250000)).toBe("1.250.000");
    expect(angkaStruk(-2000)).toBe("-2.000");
    expect(angkaStruk(0)).toBe("0");
    expect(angkaStruk(1.5)).toBe("1,5");
    expect(waktuStruk(lokal(11, 24, 8, 0))).toBe("24/11/2026 08.00");
  });

  it("tautan laporan per periode", () => {
    expect(urlLaporanPeriode("abc")).toBe("/dashboard/outlet/keuangan/laporanTutupKasir/abc");
  });
});
