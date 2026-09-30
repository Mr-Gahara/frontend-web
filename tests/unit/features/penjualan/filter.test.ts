import { describe, expect, it } from "vitest";
import {
  filterServerPenjualan,
  navigasiHalaman,
  saringPenjualan,
  tentukanLingkupPenjualan,
  type LingkupPenjualan,
  type MasukanLingkupPenjualan,
} from "@/features/penjualan/filter";
import { bolehCakupanPenjualan } from "@/features/penjualan/izin";
import type { CakupanLokasiOutlet } from "@/features/inventaris/cakupan";
import type { Penjualan } from "@/types/penjualan";

function penjualan(id: string, locationID: string | null): Penjualan {
  return {
    id,
    tenantID: "t",
    locationID,
    noReferensi: "INV-" + id,
    dataPengguna: null,
    dataPelanggan: null,
    jenisTransaksi: "INVOICE",
    jenisPenjualan: "dine-in",
    tanggalTransaksi: "",
    jatuhTempo: null,
    itemPenjualan: [],
    totalHargaProduk: 0,
    diskonGlobal: [],
    jumlahDiskonTransaksi: 0,
    pajakTransaksi: [],
    jumlahPajakTransaksi: 0,
    totalTagihan: 0,
    totalDibayar: 0,
    sisaTagihan: 0,
    statusBayar: "UNPAID",
    statusPenjualan: "DRAFT",
    keterangan: "",
    createdAt: "",
    updatedAt: "",
  };
}

const terkunci: CakupanLokasiOutlet = { status: "terkunci", lokasi: null, lokasiId: "outlet-a" };
const lintas: CakupanLokasiOutlet = { status: "lintas", lokasiOutlet: [] };

const dasar: MasukanLingkupPenjualan = {
  sesiMemuat: false,
  bolehCakupan: true,
  cakupan: terkunci,
  pilihan: "SEMUA",
  outletTenantId: "outlet-a",
  memuatOutletTenant: false,
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
    expect(tentukanLingkupPenjualan(dasar)).toEqual({
      jenis: "lokasi",
      locationID: "outlet-a",
      outletTenantId: "outlet-a",
    });
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

  it("lintas outlet dengan satu outlet: menunggu outlet tenant, lalu satu lokasi", () => {
    const masukan = { ...dasar, cakupan: lintas, pilihan: "outlet-b" };
    expect(tentukanLingkupPenjualan({ ...masukan, memuatOutletTenant: true })).toBeNull();
    expect(tentukanLingkupPenjualan(masukan)).toEqual({
      jenis: "lokasi",
      locationID: "outlet-b",
      outletTenantId: "outlet-a",
    });
  });
});

describe("saringPenjualan", () => {
  it("penjualan tanpa lokasi dianggap milik outlet tenant, urutan dipertahankan", () => {
    const daftar = [penjualan("1", "outlet-a"), penjualan("2", null), penjualan("3", "outlet-b")];
    const lokasiA: LingkupPenjualan = { jenis: "lokasi", locationID: "outlet-a", outletTenantId: "outlet-a" };
    const lokasiB: LingkupPenjualan = { jenis: "lokasi", locationID: "outlet-b", outletTenantId: "outlet-a" };
    expect(saringPenjualan(daftar, lokasiA).map((p) => p.id)).toEqual(["1", "2"]);
    expect(saringPenjualan(daftar, lokasiB).map((p) => p.id)).toEqual(["3"]);
    expect(saringPenjualan(daftar, { jenis: "semua" }).map((p) => p.id)).toEqual(["1", "2", "3"]);
  });
});

describe("navigasiHalaman", () => {
  const pag = (page: number, total: number, totalPages: number) => ({ page, limit: 10, total, totalPages });

  it("tanpa pagination: tanpa keterangan dan kedua tombol nonaktif", () => {
    expect(navigasiHalaman(null, 1)).toEqual({ teks: "", sebelumnya: false, berikutnya: false });
  });

  it("halaman tengah: kedua arah aktif", () => {
    expect(navigasiHalaman(pag(2, 25, 3), 2)).toEqual({
      teks: "Halaman 2 dari 3 (25 penjualan)",
      sebelumnya: true,
      berikutnya: true,
    });
  });

  it("halaman pertama, halaman terakhir, dan daftar kosong", () => {
    expect(navigasiHalaman(pag(1, 25, 3), 1)).toMatchObject({ sebelumnya: false, berikutnya: true });
    expect(navigasiHalaman(pag(3, 25, 3), 3)).toMatchObject({ sebelumnya: true, berikutnya: false });
    expect(navigasiHalaman(pag(1, 0, 0), 1)).toEqual({
      teks: "Halaman 1 dari 1 (0 penjualan)",
      sebelumnya: false,
      berikutnya: false,
    });
  });

  it("halaman di luar jumlah halaman tetap dapat mundur", () => {
    expect(navigasiHalaman(pag(4, 30, 3), 4)).toMatchObject({ sebelumnya: true, berikutnya: false });
  });
});

describe("bolehCakupanPenjualan", () => {
  it("hanya pemegang read-location", () => {
    expect(bolehCakupanPenjualan(["read-penjualan", "read-location"])).toBe(true);
    expect(bolehCakupanPenjualan(["read-penjualan"])).toBe(false);
  });
});