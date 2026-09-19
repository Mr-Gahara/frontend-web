import { describe, expect, it } from "vitest";
import { susunPayloadProduk } from "@/features/produk/payload";
import { skemaProduk, type NilaiFormProduk } from "@/features/produk/schema";

const dasar: NilaiFormProduk = {
  namaProduk: "Kopi Susu",
  kategoriID: "k1",
  gambarProduk: "",
  keterangan: "",
  hargaDasar: 10000,
  hargaJual: 15000,
  stok: 25,
  isUnlimitedStok: false,
  resep: [],
};

const resep = [{ bahanBakuID: "b1", jumlah: 20, satuan: "gram" as const }];

describe("susunPayloadProduk", () => {
  it("buat tanpa resep: resep tidak dikirim dan stok dipertahankan", () => {
    const payload = susunPayloadProduk(dasar, { resepAwalAda: false });
    expect(payload.resep).toBeUndefined();
    expect(payload.stok).toBe(25);
  });

  it("edit tanpa resep sebelum dan sesudah: resep tidak dikirim agar stok tidak ditimpa backend", () => {
    const payload = susunPayloadProduk(
      { ...dasar, namaProduk: "Kopi Susu Baru" },
      { resepAwalAda: false },
    );
    expect(payload.resep).toBeUndefined();
    expect(payload.stok).toBe(25);
  });

  it("edit yang menghapus seluruh resep: resep kosong tetap dikirim", () => {
    const payload = susunPayloadProduk(dasar, { resepAwalAda: true });
    expect(payload.resep).toEqual([]);
  });

  it("produk beresep: resep dikirim, stok 0, dan unlimited dimatikan", () => {
    const payload = susunPayloadProduk(
      { ...dasar, resep, isUnlimitedStok: true },
      { resepAwalAda: false },
    );
    expect(payload.resep).toEqual(resep);
    expect(payload.stok).toBe(0);
    expect(payload.isUnlimitedStok).toBe(false);
  });

  it("produk unlimited tanpa resep: stok dikirim 0", () => {
    const payload = susunPayloadProduk(
      { ...dasar, isUnlimitedStok: true },
      { resepAwalAda: false },
    );
    expect(payload.stok).toBe(0);
    expect(payload.isUnlimitedStok).toBe(true);
  });
});

describe("skemaProduk", () => {
  it("menolak satuan resep yang tidak diterima backend", () => {
    const hasil = skemaProduk.safeParse({
      ...dasar,
      resep: [{ bahanBakuID: "b1", jumlah: 1, satuan: "pak" }],
    });
    expect(hasil.success).toBe(false);
    expect(hasil.error?.issues[0]?.message).toMatch(/satuan tidak didukung/i);
  });

  it("menerima satuan resep yang didukung", () => {
    expect(skemaProduk.safeParse({ ...dasar, resep }).success).toBe(true);
  });
});