import { describe, expect, it } from "vitest";
import { aksiKategoriBeban } from "@/features/kategori-beban/izin";
import { skemaKategoriBeban } from "@/features/kategori-beban/schema";

describe("skemaKategoriBeban", () => {
  it("menerima nama sah dan memangkasnya", () => {
    const hasil = skemaKategoriBeban.safeParse({ namaKategori: "  Listrik  " });
    expect(hasil.success).toBe(true);
    expect(hasil.data?.namaKategori).toBe("Listrik");
  });

  it("menolak nama kosong dan lebih dari 100 karakter", () => {
    expect(skemaKategoriBeban.safeParse({ namaKategori: "   " }).success).toBe(false);
    expect(skemaKategoriBeban.safeParse({ namaKategori: "a".repeat(101) }).success).toBe(false);
  });
});

describe("aksiKategoriBeban", () => {
  it("mengikuti izin endpoint", () => {
    expect(aksiKategoriBeban(["read-kategori-beban", "delete-kategori-beban"])).toEqual({
      baca: true,
      buat: false,
      ubah: false,
      hapus: true,
    });
  });
});