import { describe, expect, it } from "vitest";
import {
  butirProduk,
  payloadBahanSetup,
  payloadProdukSetup,
  payloadTarifSetup,
} from "@/features/setup/payload";
import { masalahAngkaPositif, skemaOwner, skemaProdukSetup, type NilaiProdukSetup } from "@/features/setup/schema";
import { formatRupiah } from "@/lib/format";
import type { Kategori } from "@/types/kategori";
import type { Produk } from "@/types/produk";

const produk = (ubah: Partial<NilaiProdukSetup> = {}): NilaiProdukSetup => ({
  namaProduk: " Es Kopi ",
  kategoriID: "k1",
  hargaDasar: "8000",
  hargaJual: "15000",
  pakaiStok: true,
  stok: "20",
  stokMinimal: "5",
  pakaiResep: false,
  resep: [],
  ...ubah,
});

describe("payloadProdukSetup", () => {
  it("produk berstok mengirim stok dan stok minimal (B237, B238)", () => {
    expect(payloadProdukSetup(produk())).toEqual({
      namaProduk: "Es Kopi",
      kategoriID: "k1",
      hargaDasar: 8000,
      hargaJual: 15000,
      isUnlimitedStok: false,
      stok: 20,
      stokMinimum: 5,
    });
  });

  it("produk tanpa stok menjadi Stok Tak Terbatas", () => {
    expect(payloadProdukSetup(produk({ pakaiStok: false }))).toMatchObject({ isUnlimitedStok: true, stok: 0 });
    expect(payloadProdukSetup(produk({ pakaiStok: false }))).not.toHaveProperty("stokMinimum");
  });

  it("produk beresep mengirim resep tanpa stok minimal, walau isian stok terisi", () => {
    const hasil = payloadProdukSetup(
      produk({ pakaiResep: true, resep: [{ bahan: "b1", jumlah: "18", satuan: "gram" }] }),
    );
    expect(hasil).toMatchObject({ isUnlimitedStok: false, stok: 0, resep: [{ bahanBakuID: "b1", jumlah: 18, satuan: "gram" }] });
    expect(hasil).not.toHaveProperty("stokMinimum");
  });
});

describe("skema produk dan Owner setup", () => {
  it("stok awal dan stok minimal produk berstok harus lebih dari 0 (B238)", () => {
    const hasil = skemaProdukSetup.safeParse(produk({ stok: "0", stokMinimal: "0" }));
    expect(hasil.error?.issues.map((i) => i.message)).toEqual([
      "Stok awal harus lebih dari 0.",
      "Stok minimal harus lebih dari 0.",
    ]);
    expect(masalahAngkaPositif("2", "Stok")).toBeNull();
  });

  it("produk beresep tidak memeriksa stok", () => {
    const beresep = produk({ stok: "", stokMinimal: "", pakaiResep: true, resep: [{ bahan: "b1", jumlah: "1", satuan: "gram" }] });
    expect(skemaProdukSetup.safeParse(beresep).success).toBe(true);
  });

  it("nama Owner 3 sampai 50 karakter, sama dengan backend", () => {
    const owner = (nama: string) => skemaOwner.safeParse({ nama, pin: "123456", ulangiPin: "123456" }).success;
    expect(owner("Bu")).toBe(false);
    expect(owner("Budi")).toBe(true);
    expect(owner("a".repeat(51))).toBe(false);
  });
});

describe("payload bahan, tarif, dan ringkasan produk", () => {
  it("bahan baku: angka dari teks, tanpa locationID", () => {
    expect(payloadBahanSetup({ namaBahan: " Susu ", satuan: "ml", stok: "1000", stokMinimum: "200" })).toEqual({
      namaBahan: "Susu",
      satuan: "ml",
      stok: 1000,
      stokMinimum: 200,
    });
  });

  it("tarif pertama berlaku setiap hari untuk tipe aset setup", () => {
    const n = { namaTipeAset: "Meja", namaAset: "Meja 1", namaTarif: "Reguler", basisPerhitungan: "per jam" as const, harga: "20000", durasiMinimum: "1" };
    expect(payloadTarifSetup(n, "t1")).toMatchObject({
      harga: 20000,
      durasiMinimum: 1,
      isActive: true,
      hariAktif: [0, 1, 2, 3, 4, 5, 6],
      tipeAsetID: ["t1"],
    });
  });

  it("ringkasan produk menyebut kategori, harga, resep, dan stok", () => {
    const p = { id: "p1", namaProduk: "Es Kopi", kategoriID: "k1", hargaJual: 15000, stok: 20, isUnlimitedStok: false, resep: [] } as unknown as Produk;
    const kategori = [{ id: "k1", namaKategori: "Minuman", kodeKategori: "MIN" }] as unknown as Kategori[];
    expect(butirProduk(p, kategori).keterangan).toBe(
      `Minuman, ${formatRupiah(15000)}, tanpa resep, stok 20`,
    );
  });
});
