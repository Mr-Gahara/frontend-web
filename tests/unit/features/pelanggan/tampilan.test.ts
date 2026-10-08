import { describe, expect, it } from "vitest";
import {
  cocokCariPelanggan,
  labelPelanggan,
  labelPelangganTerpilih,
  nilaiPilihanPelanggan,
} from "@/features/pelanggan/tampilan";

const budi = {
  id: "64f000000000000000000001",
  namaPelanggan: "Budi",
  nomorHp: "0812000111",
};
const budiLain = {
  id: "64f000000000000000000002",
  namaPelanggan: "Budi",
  nomorHp: null,
};

describe("labelPelanggan", () => {
  it("menambahkan nomor HP bila ada, dan hanya nama bila tidak", () => {
    expect(labelPelanggan(budi)).toBe("Budi (0812000111)");
    expect(labelPelanggan(budiLain)).toBe("Budi");
    expect(labelPelanggan({ namaPelanggan: "Sari" })).toBe("Sari");
  });
});

describe("labelPelangganTerpilih", () => {
  it("memberi label pelanggan ber-id itu, dan null bila tidak ada di daftar", () => {
    const daftar = [budi, budiLain];
    expect(labelPelangganTerpilih(daftar, budi.id)).toBe("Budi (0812000111)");
    expect(labelPelangganTerpilih(daftar, budiLain.id)).toBe("Budi");
    expect(labelPelangganTerpilih(daftar, "64f0000000000000000000ff")).toBeNull();
  });
});

describe("cocokCariPelanggan", () => {
  it("mencocokkan nama atau nomor HP tanpa membedakan huruf besar kecil", () => {
    expect(cocokCariPelanggan(budi, "bud")).toBe(true);
    expect(cocokCariPelanggan(budi, "  BUDI ")).toBe(true);
    expect(cocokCariPelanggan(budi, "0812")).toBe(true);
    expect(cocokCariPelanggan(budi, "0899")).toBe(false);
    expect(cocokCariPelanggan(budiLain, "0812")).toBe(false);
    expect(cocokCariPelanggan(budiLain, "")).toBe(true);
  });
});

describe("nilaiPilihanPelanggan", () => {
  it("berbeda untuk dua pelanggan bernama sama", () => {
    expect(nilaiPilihanPelanggan(budi)).not.toBe(nilaiPilihanPelanggan(budiLain));
    expect(nilaiPilihanPelanggan(budi)).toContain("Budi (0812000111)");
    expect(nilaiPilihanPelanggan(budiLain)).toContain(budiLain.id);
  });
});