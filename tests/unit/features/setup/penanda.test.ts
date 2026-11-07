import { describe, expect, it } from "vitest";
import { adaIsian, pesanBelumTersimpan } from "@/features/setup/penanda";

describe("adaIsian", () => {
  it("benar bila ada isian teks yang terisi", () => {
    expect(adaIsian(["", "Kopi"])).toBe(true);
    expect(adaIsian([undefined, "0"])).toBe(true);
  });

  it("salah untuk isian kosong, spasi saja, dan nilai bukan teks", () => {
    expect(adaIsian([])).toBe(false);
    expect(adaIsian(["", "   ", undefined, null])).toBe(false);
    expect(adaIsian([true, 3])).toBe(false);
  });
});

describe("pesanBelumTersimpan", () => {
  it("menyebut nama butir dan tombol yang harus ditekan", () => {
    expect(pesanBelumTersimpan("Kategori", "Kopi", "Tambah kategori")).toBe(
      'Kategori "Kopi" belum ditambahkan. Tekan Tambah kategori dulu, atau kosongkan isiannya.',
    );
    expect(pesanBelumTersimpan("Produk", " Air mineral ", "Simpan produk", "disimpan")).toBe(
      'Produk "Air mineral" belum disimpan. Tekan Simpan produk dulu, atau kosongkan isiannya.',
    );
  });

  it("tanpa nama, menyebut isiannya", () => {
    expect(pesanBelumTersimpan("Bahan baku", "", "Tambah bahan baku")).toBe(
      "Isian bahan baku belum ditambahkan. Tekan Tambah bahan baku dulu, atau kosongkan isiannya.",
    );
    expect(pesanBelumTersimpan("Pajak", undefined, "Tambah pajak")).toBe(
      "Isian pajak belum ditambahkan. Tekan Tambah pajak dulu, atau kosongkan isiannya.",
    );
  });
});