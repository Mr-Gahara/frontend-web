import { describe, expect, it } from "vitest";
import { FILTER_AWAL_PEMBELIAN, filterAwalDaftarPembelian } from "@/features/pembelian-stok/payload";
import { TIPE_LOKASI_PEMBELIAN, URL_PEMBELIAN, urlDetailPembelian } from "@/features/pembelian-stok/ruang";
import {
  lokasiPembelian,
  namaAkunPembelian,
  namaBahanItem,
  namaPencatat,
  ringkasBarang,
  teksJumlahItem,
} from "@/features/pembelian-stok/tampilan";
import type { Lokasi } from "@/types/location";
import type { ItemPembelianStok, PembelianStok } from "@/types/pembelianStok";

const gula: ItemPembelianStok = {
  bahanBakuID: { id: "gula", namaBahan: "Gula Pasir", satuan: "kg" },
  jumlah: 1.5,
  hargaBeli: 15000,
  subtotal: 22500,
};
const terhapus: ItemPembelianStok = { bahanBakuID: null, jumlah: 2, hargaBeli: 1000, subtotal: 2000 };

const pembelian: PembelianStok = {
  id: "beli-1",
  tanggal: "2026-10-24T05:00:00.000Z",
  akunKasID: { id: "akun-a", namaAkun: "Kas Kecil (Laci)", nomorAkun: "CASH-001" },
  supplier: "CV Manis",
  keterangan: "Belanja mingguan",
  items: [gula],
  totalBiaya: 22500,
  locationID: "lok-outlet",
  nomorFaktur: "FK-1",
  dicatatOleh: { id: "peng-1", nama: "Budi" },
  stokDitambahkan: true,
  tenantID: "tenant-1",
  createdAt: "2026-10-24T05:00:00.000Z",
  updatedAt: "2026-10-24T05:00:00.000Z",
};

describe("nama dan ringkasan barang", () => {
  it("bahan terhapus ditandai", () => {
    expect(namaBahanItem(gula)).toBe("Gula Pasir");
    expect(namaBahanItem(terhapus)).toBe("Bahan Terhapus");
  });

  it("ringkasan menyebut barang pertama dan jumlah barang lain", () => {
    expect(ringkasBarang([])).toEqual({ utama: "-", lainnya: null });
    expect(ringkasBarang([gula])).toEqual({ utama: "Gula Pasir", lainnya: null });
    expect(ringkasBarang([gula, terhapus, gula])).toEqual({ utama: "Gula Pasir", lainnya: "+2 barang lain" });
  });

  it("jumlah memakai koma desimal dan satuan bahan, tanpa satuan bila bahan terhapus", () => {
    expect(teksJumlahItem(gula)).toBe("1,5 kg");
    expect(teksJumlahItem({ ...gula, jumlah: 10 })).toBe("10 kg");
    expect(teksJumlahItem(terhapus)).toBe("2");
  });
});

describe("relasi pembelian", () => {
  it("nama akun dan pencatat, atau tanda hubung bila relasinya terhapus", () => {
    expect(namaAkunPembelian(pembelian)).toBe("Kas Kecil (Laci)");
    expect(namaPencatat(pembelian)).toBe("Budi");
    expect(namaAkunPembelian({ ...pembelian, akunKasID: null })).toBe("-");
    expect(namaPencatat({ ...pembelian, dicatatOleh: null })).toBe("-");
  });

  it("lokasi penerima dicari di daftar lokasi", () => {
    const outlet = { id: "lok-outlet", nama: "Outlet Pusat", tipe: "Outlet" } as Lokasi;
    expect(lokasiPembelian(pembelian, [outlet])).toBe(outlet);
    expect(lokasiPembelian(pembelian, [])).toBeNull();
    expect(lokasiPembelian(pembelian, undefined)).toBeNull();
    expect(lokasiPembelian({ ...pembelian, locationID: null }, [outlet])).toBeNull();
  });
});

describe("ruang pembelian", () => {
  it("URL dan tipe lokasi per ruang", () => {
    expect(URL_PEMBELIAN.outlet).toBe("/dashboard/outlet/inventaris/pembelianStok");
    expect(urlDetailPembelian("gudang", "beli-1")).toBe("/dashboard/gudang/pembelianStok/beli-1");
    expect(TIPE_LOKASI_PEMBELIAN).toEqual({ outlet: "Outlet", gudang: "Gudang" });
  });
});

describe("filterAwalDaftarPembelian", () => {
  it("tanggal 1 bulan berjalan sampai hari ini, tanpa filter lain", () => {
    const filter = filterAwalDaftarPembelian(new Date(2026, 9, 25, 15, 30));
    expect(filter).toEqual({
      ...FILTER_AWAL_PEMBELIAN,
      dari: new Date(2026, 9, 1),
      sampai: new Date(2026, 9, 25),
    });
  });
});