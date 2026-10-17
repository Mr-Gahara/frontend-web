import { describe, expect, it } from "vitest";
import { teksJumlahJurnal } from "@/features/jurnal-stok/tampilan";

const gula = { id: "b1", namaBahan: "Gula", satuan: "kg" };

describe("teksJumlahJurnal", () => {
  it("barang masuk bertanda plus beserta satuan bahan", () => {
    expect(teksJumlahJurnal({ tipeKoreksi: "Masuk", jumlah: 20, bahanBakuID: gula })).toBe("+20 kg");
  });

  it("barang keluar bertanda minus", () => {
    expect(teksJumlahJurnal({ tipeKoreksi: "Keluar", jumlah: 2, bahanBakuID: gula })).toBe("-2 kg");
  });

  it("master bahan yang terhapus memakai satuan unit", () => {
    expect(teksJumlahJurnal({ tipeKoreksi: "Masuk", jumlah: 5, bahanBakuID: null })).toBe("+5 unit");
  });
});
