import { describe, expect, it } from "vitest";
import {
  filterServerPenjualan,
  PILIHAN_UKURAN_HALAMAN,
  UKURAN_HALAMAN_BAWAAN,
  paramLingkupPenjualan,
  tentukanLingkupPenjualan,
  type MasukanLingkupPenjualan,
} from "@/features/penjualan/filter";
import { bolehCakupanPenjualan } from "@/features/penjualan/izin";
import type { CakupanLokasiOutlet } from "@/features/inventaris/cakupan";

const terkunci: CakupanLokasiOutlet = { status: "terkunci", lokasi: null, lokasiId: "outlet-a" };
const lintas: CakupanLokasiOutlet = { status: "lintas", lokasiOutlet: [] };

const dasar: MasukanLingkupPenjualan = {
  sesiMemuat: false,
  bolehCakupan: true,
  cakupan: terkunci,
  pilihan: "SEMUA",
};

describe("filterServerPenjualan", () => {
  it("hanya mengirim filter yang terisi", () => {
    expect(
      filterServerPenjualan({
        statusPenjualan: "PAID",
        noReferensi: "",
        pelangganID: "",
        startDate: "2026-09-01",
        jenisTransaksi: undefined,
      }),
    ).toEqual({ statusPenjualan: "PAID", startDate: "2026-09-01" });
  });
});

describe("tentukanLingkupPenjualan", () => {
  it("belum siap selama sesi dimuat", () => {
    expect(tentukanLingkupPenjualan({ ...dasar, sesiMemuat: true })).toBeNull();
  });

  it("tanpa read-location: seluruh penjualan tenant (K11b)", () => {
    expect(
      tentukanLingkupPenjualan({ ...dasar, bolehCakupan: false, cakupan: { status: "memuat" } }),
    ).toEqual({ jenis: "semua" });
  });

  it("terkunci: satu lokasi, yaitu outlet tenant", () => {
    expect(tentukanLingkupPenjualan(dasar)).toEqual({ jenis: "lokasi", locationID: "outlet-a" });
  });

  it("terkunci tanpa outlet: belum siap", () => {
    expect(
      tentukanLingkupPenjualan({ ...dasar, cakupan: { status: "terkunci", lokasi: null, lokasiId: "" } }),
    ).toBeNull();
  });

  it("cakupan gagal: belum siap", () => {
    expect(tentukanLingkupPenjualan({ ...dasar, cakupan: { status: "gagal" } })).toBeNull();
  });

  it("lintas outlet dengan Semua Outlet: seluruh penjualan", () => {
    expect(tentukanLingkupPenjualan({ ...dasar, cakupan: lintas, pilihan: "SEMUA" })).toEqual({
      jenis: "semua",
    });
  });

  it("lintas outlet dengan satu outlet: langsung satu lokasi, tanpa menunggu outlet tenant", () => {
    expect(tentukanLingkupPenjualan({ ...dasar, cakupan: lintas, pilihan: "outlet-b" })).toEqual({
      jenis: "lokasi",
      locationID: "outlet-b",
    });
  });
});

describe("paramLingkupPenjualan", () => {
  it("satu lokasi dikirim sebagai locationID; semua dan belum siap tanpa query (RG4a)", () => {
    expect(paramLingkupPenjualan({ jenis: "lokasi", locationID: "outlet-b" })).toEqual({ locationID: "outlet-b" });
    expect(paramLingkupPenjualan({ jenis: "semua" })).toEqual({});
    expect(paramLingkupPenjualan(null)).toEqual({});
  });
});

describe("bolehCakupanPenjualan", () => {
  it("hanya pemegang read-location", () => {
    expect(bolehCakupanPenjualan(["read-penjualan", "read-location"])).toBe(true);
    expect(bolehCakupanPenjualan(["read-penjualan"])).toBe(false);
  });
});
describe("pilihan ukuran halaman", () => {
  it("berada dalam batas limit backend 1 sampai 100 dan memuat bawaannya", () => {
    expect(PILIHAN_UKURAN_HALAMAN).toEqual([10, 20, 50, 100]);
    expect(PILIHAN_UKURAN_HALAMAN.every((n) => n >= 1 && n <= 100)).toBe(true);
    expect(PILIHAN_UKURAN_HALAMAN).toContain(UKURAN_HALAMAN_BAWAAN);
  });
});
