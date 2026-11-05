import { describe, expect, it } from "vitest";
import { daftarLangkah } from "@/features/setup/langkah";
import { masalahAngka, skemaOwner, skemaProdukSetup } from "@/features/setup/schema";

const INTI = ["toko", "owner", "lokasi", "kategori", "bahanBaku", "produk", "pajak"];

describe("daftarLangkah", () => {
  it("Basic memuat tujuh langkah inti berurutan", () => {
    expect(daftarLangkah("basic").map((l) => l.kunci)).toEqual(INTI);
  });
  it("Advanced menambah sesi booking di akhir", () => {
    expect(daftarLangkah("advanced").map((l) => l.kunci)).toEqual([...INTI, "booking"]);
  });
  it("Pro menambah sesi booking lalu gudang", () => {
    expect(daftarLangkah("pro").map((l) => l.kunci)).toEqual([...INTI, "booking", "gudang"]);
  });
});

describe("masalahAngka", () => {
  it("menolak kosong, bukan angka, dan di bawah batas", () => {
    expect(masalahAngka(" ", "Harga")).toBe("Harga wajib diisi.");
    expect(masalahAngka("12a", "Harga")).toBe("Harga harus berupa angka.");
    expect(masalahAngka("-1", "Harga")).toBe("Harga tidak boleh negatif.");
    expect(masalahAngka("0", "Durasi", 1)).toBe("Durasi minimal 1.");
  });
  it("menerima 0 bila batasnya 0", () => {
    expect(masalahAngka("0", "Stok")).toBeNull();
  });
});

describe("skemaOwner", () => {
  it("menolak PIN yang tidak sama", () => {
    const hasil = skemaOwner.safeParse({ nama: "Rina", pin: "123456", ulangiPin: "123457" });
    expect(hasil.success).toBe(false);
    expect(hasil.error?.issues[0]?.path).toEqual(["ulangiPin"]);
  });
  it("menolak PIN yang bukan 6 digit", () => {
    expect(skemaOwner.safeParse({ nama: "Rina", pin: "12345", ulangiPin: "12345" }).success).toBe(false);
  });
});

describe("skemaProdukSetup", () => {
  const dasar = {
    namaProduk: "Croissant",
    kategoriID: "k1",
    hargaDasar: "9000",
    hargaJual: "18000",
    pakaiStok: false,
    stok: "",
    stokMinimal: "",
    pakaiResep: false,
    resep: [],
  };
  it("stok tidak diperiksa bila tidak pakai stok", () => {
    expect(skemaProdukSetup.safeParse(dasar).success).toBe(true);
  });
  it("stok awal dan minimal wajib bila pakai stok", () => {
    const hasil = skemaProdukSetup.safeParse({ ...dasar, pakaiStok: true });
    expect(hasil.error?.issues.map((i) => i.path.join("."))).toEqual(["stok", "stokMinimal"]);
  });
  it("pakai resep wajib minimal satu bahan dengan jumlah lebih dari 0", () => {
    expect(skemaProdukSetup.safeParse({ ...dasar, pakaiResep: true }).error?.issues[0]?.path).toEqual(["resep"]);
    const hasil = skemaProdukSetup.safeParse({
      ...dasar,
      pakaiResep: true,
      resep: [{ bahan: "", jumlah: "0", satuan: "gram" }],
    });
    expect(hasil.error?.issues.map((i) => i.path.join("."))).toEqual(["resep.0.bahan", "resep.0.jumlah"]);
  });
});