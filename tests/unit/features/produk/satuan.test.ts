import { describe, expect, it } from "vitest";
import {
  buatSkemaProduk,
  satuanResepUntukBahan,
  SATUAN_RESEP,
  type NilaiFormProduk,
} from "@/features/produk/schema";

const bahan = (id: string, satuan: string, availableUnits?: string[]) =>
  ({ id, namaBahan: "Bahan " + id, satuan, availableUnits }) as Parameters<typeof satuanResepUntukBahan>[0] & {
    id: string;
  };

const nilai = (resep: NilaiFormProduk["resep"]): NilaiFormProduk => ({
  namaProduk: "Produk Uji",
  kategoriID: "kat-1",
  gambarProduk: "",
  keterangan: "",
  hargaDasar: 1000,
  hargaJual: 2000,
  stok: 0,
  isUnlimitedStok: false,
  resep,
});

describe("satuanResepUntukBahan", () => {
  it("tanpa bahan terpilih: seluruh satuan resep ditawarkan", () => {
    expect(satuanResepUntukBahan(null)).toEqual([...SATUAN_RESEP]);
  });

  it("mengikuti availableUnits dari backend, dalam urutan satuan resep", () => {
    expect(satuanResepUntukBahan(bahan("a", "kg", ["kg", "gram"]))).toEqual(["gram", "kg"]);
    expect(satuanResepUntukBahan(bahan("b", "ml", ["ml"]))).toEqual(["ml"]);
  });

  it("tanpa availableUnits: hanya satuan bahan itu sendiri", () => {
    expect(satuanResepUntukBahan(bahan("c", "liter"))).toEqual(["liter"]);
    expect(satuanResepUntukBahan(bahan("d", "gram", []))).toEqual(["gram"]);
  });

  it("bahan bersatuan pak atau unit memakai satuannya sendiri", () => {
    expect(satuanResepUntukBahan(bahan("e", "pak", ["pak"]))).toEqual(["pak"]);
    expect(satuanResepUntukBahan(bahan("f", "unit"))).toEqual(["unit"]);
  });

  it("satuan yang tidak dikenal web menghasilkan daftar kosong", () => {
    expect(satuanResepUntukBahan(bahan("g", "lusin", ["lusin"]))).toEqual([]);
  });
});

describe("buatSkemaProduk", () => {
  const daftar = [bahan("gula", "gram", ["gram"]), bahan("dus", "pak", ["pak"])];

  it("menerima satuan resep yang ditawarkan untuk bahannya", () => {
    const hasil = buatSkemaProduk(daftar).safeParse(
      nilai([{ bahanBakuID: "gula", jumlah: 10, satuan: "gram" }]),
    );
    expect(hasil.success).toBe(true);
  });

  it("menolak satuan yang tidak ditawarkan, di baris dan isian yang tepat", () => {
    const hasil = buatSkemaProduk(daftar).safeParse(
      nilai([
        { bahanBakuID: "gula", jumlah: 10, satuan: "gram" },
        { bahanBakuID: "gula", jumlah: 5, satuan: "ml" },
      ]),
    );
    expect(hasil.success).toBe(false);
    if (hasil.success) return;
    expect(hasil.error.issues.map((i) => i.path)).toEqual([["resep", 1, "satuan"]]);
    expect(hasil.error.issues[0].message).toMatch(/gram/);
  });

  it("bahan bersatuan pak: menerima pak, dan menolak satuan lain dengan menyebut pilihannya", () => {
    const sah = buatSkemaProduk(daftar).safeParse(
      nilai([{ bahanBakuID: "dus", jumlah: 1, satuan: "pak" }]),
    );
    expect(sah.success).toBe(true);
    const hasil = buatSkemaProduk(daftar).safeParse(
      nilai([{ bahanBakuID: "dus", jumlah: 1, satuan: "pcs" }]),
    );
    expect(hasil.success).toBe(false);
    if (hasil.success) return;
    expect(hasil.error.issues[0].message).toMatch(/pilih pak/);
  });

  it("menolak bahan yang satuannya tidak dikenal web, dengan pesan tersendiri", () => {
    const hasil = buatSkemaProduk([bahan("lsn", "lusin", ["lusin"])]).safeParse(
      nilai([{ bahanBakuID: "lsn", jumlah: 1, satuan: "pcs" }]),
    );
    expect(hasil.success).toBe(false);
    if (hasil.success) return;
    expect(hasil.error.issues[0].message).toMatch(/belum dapat dipakai di resep/);
  });

  it("melewati baris yang bahannya belum termuat di daftar", () => {
    const hasil = buatSkemaProduk([]).safeParse(
      nilai([{ bahanBakuID: "tidak-dikenal", jumlah: 1, satuan: "kg" }]),
    );
    expect(hasil.success).toBe(true);
  });
});