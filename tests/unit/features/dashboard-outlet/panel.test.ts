import { describe, expect, it } from "vitest";

import { panelDashboard } from "@/features/dashboard-outlet/izin";
import { susunPetak, type PetakVenue } from "@/features/dashboard-outlet/venue";
import type { StatusAset } from "@/types/aset";

function petak(nama: string, status: StatusAset = "tersedia"): PetakVenue {
  return { id: nama, nama, status, pelanggan: null, tipePelanggan: null, sisaMenit: null };
}

describe("panelDashboard", () => {
  it("tanpa izin apa pun tidak memasang panel berizin", () => {
    expect(panelDashboard([])).toEqual({
      laporan: false,
      transaksi: false,
      rincianVenue: false,
      staf: false,
      izinCuti: false,
    });
  });

  it("panel staf menuntut read-absensi dan read-pengguna sekaligus", () => {
    expect(panelDashboard(["read-absensi"]).staf).toBe(false);
    expect(panelDashboard(["read-pengguna"]).staf).toBe(false);
    expect(panelDashboard(["read-absensi", "read-pengguna"]).staf).toBe(true);
  });

  it("setiap panel mengikuti izin endpoint-nya", () => {
    const panel = panelDashboard(["read-laporan", "read-penjualan", "read-booking", "read-izin-cuti"]);
    expect(panel).toEqual({
      laporan: true,
      transaksi: true,
      rincianVenue: true,
      staf: false,
      izinCuti: true,
    });
  });
});

describe("susunPetak", () => {
  it("sampai enam aset tampil besar dan apa adanya", () => {
    const daftar = ["A1", "A2", "A3", "A4", "A5", "A6"].map((n) => petak(n));
    expect(susunPetak(daftar)).toEqual({ tampil: daftar, total: 6, ringkas: false });
  });

  it("tujuh sampai sepuluh aset mengecil tanpa dipotong dan tanpa diurut ulang", () => {
    const daftar = Array.from({ length: 10 }, (_, i) => petak(`A${i + 1}`, i === 9 ? "digunakan" : "tersedia"));
    const hasil = susunPetak(daftar);
    expect(hasil.ringkas).toBe(true);
    expect(hasil.tampil).toEqual(daftar);
  });

  it("lebih dari sepuluh aset dipotong ke sepuluh, dengan yang dipakai lebih dulu", () => {
    const daftar = Array.from({ length: 12 }, (_, i) =>
      petak(`A${i + 1}`, i === 11 ? "digunakan" : i === 0 ? "perbaikan" : "tersedia"),
    );
    const hasil = susunPetak(daftar);
    expect(hasil.total).toBe(12);
    expect(hasil.tampil).toHaveLength(10);
    expect(hasil.tampil[0].nama).toBe("A12");
    expect(hasil.tampil.map((p) => p.nama)).not.toContain("A1");
  });
});