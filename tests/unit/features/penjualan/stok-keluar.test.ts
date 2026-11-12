import { describe, expect, it } from "vitest";
import {
  formatJumlahStok,
  kalimatLokasiStok,
  kalimatStokKosong,
  susunStokKeluar,
} from "@/features/penjualan/stok-keluar";
import type { ItemPenjualan, RincianStokPenjualan } from "@/types/penjualan";

const item = (produkID: string, namaProduk: string, jumlah: number) =>
  ({ produkID, namaProduk, jumlah }) as ItemPenjualan;

const bahan = (produkID: string, bahanBakuID: string, nama: string, satuan: string, jumlah: number) =>
  ({ jenis: "BAHAN", produkID, bahanBakuID, nama, satuan, jumlah, locationID: "outlet" }) as RincianStokPenjualan;

const stokProduk = (produkID: string, nama: string, jumlah: number) =>
  ({ jenis: "PRODUK", produkID, bahanBakuID: null, nama, satuan: null, jumlah, locationID: null }) as RincianStokPenjualan;

describe("susunStokKeluar", () => {
  it("dikelompokkan per produk menurut urutan item, dengan item tanpa potong stok di catatan", () => {
    const hasil = susunStokKeluar({
      itemPenjualan: [item("air", "Air Mineral", 1), item("kopi", "Kopi Susu", 2), item("roti", "Croissant", 1)],
      rincianStok: [
        stokProduk("roti", "Croissant", 1),
        bahan("kopi", "esp", "Espresso", "gram", 36),
        bahan("kopi", "susu", "Susu UHT", "ml", 300),
      ],
    });
    expect(hasil.kelompok.map((k) => k.judul)).toEqual(["Kopi Susu × 2", "Croissant × 1"]);
    expect(hasil.kelompok[0].baris).toEqual([
      { kunci: "B:esp", nama: "Espresso", jenis: "Bahan baku", jumlah: "36 gram" },
      { kunci: "B:susu", nama: "Susu UHT", jenis: "Bahan baku", jumlah: "300 ml" },
    ]);
    expect(hasil.kelompok[1].baris).toEqual([{ kunci: "P:roti", nama: "Croissant", jenis: "Stok produk", jumlah: "1" }]);
    expect(hasil.tanpaPotong).toEqual(["Air Mineral"]);
  });

  it("produk yang sama di dua baris item digabung beserta bahannya", () => {
    const hasil = susunStokKeluar({
      itemPenjualan: [item("kopi", "Kopi Susu", 1), item("kopi", "Kopi Susu", 2)],
      rincianStok: [bahan("kopi", "esp", "Espresso", "gram", 18), bahan("kopi", "esp", "Espresso", "gram", 36)],
    });
    expect(hasil.kelompok).toHaveLength(1);
    expect(hasil.kelompok[0].judul).toBe("Kopi Susu × 3");
    expect(hasil.kelompok[0].baris).toEqual([{ kunci: "B:esp", nama: "Espresso", jenis: "Bahan baku", jumlah: "54 gram" }]);
  });

  it("rincian kosong tidak menyebut item tanpa potong stok", () => {
    expect(susunStokKeluar({ itemPenjualan: [item("air", "Air", 1)], rincianStok: [] })).toEqual({
      kelompok: [],
      tanpaPotong: [],
    });
    expect(susunStokKeluar({ itemPenjualan: [item("air", "Air", 1)] }).kelompok).toEqual([]);
  });
});

describe("formatJumlahStok", () => {
  it("pecahan memakai koma, stok produk tanpa satuan", () => {
    expect(formatJumlahStok(0.1, "kg")).toBe("0,1 kg");
    expect(formatJumlahStok(1500, "ml")).toBe("1.500 ml");
    expect(formatJumlahStok(2, null)).toBe("2");
  });
});

describe("kalimatLokasiStok dan kalimatStokKosong", () => {
  it("nama outlet hanya bila terbaca dan sama dengan lokasi rincian", () => {
    const rincian = [bahan("kopi", "esp", "Espresso", "gram", 36)];
    expect(kalimatLokasiStok(rincian, { id: "outlet", nama: "Outlet Utama" })).toBe(
      "Dipotong dari Outlet Utama saat penjualan disimpan.",
    );
    expect(kalimatLokasiStok(rincian, null)).toBe("Dipotong saat penjualan disimpan.");
    expect(kalimatLokasiStok(rincian, { id: "lain", nama: "Outlet Lain" })).toBe("Dipotong saat penjualan disimpan.");
    expect(kalimatLokasiStok([stokProduk("roti", "Croissant", 1)], { id: "outlet", nama: "Outlet Utama" })).toBe(
      "Dipotong saat penjualan disimpan.",
    );
  });

  it("DRAFT belum dipotong, selain itu tidak ada yang tercatat", () => {
    expect(kalimatStokKosong("DRAFT")).toMatch(/belum dipotong/);
    expect(kalimatStokKosong("VOID")).toBe("Tidak ada stok yang tercatat keluar untuk penjualan ini.");
  });
});
