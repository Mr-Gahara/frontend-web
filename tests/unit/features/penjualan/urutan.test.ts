import { describe, expect, it } from "vitest";
import { KOLOM_URUT_PENJUALAN, paramUrutanPenjualan } from "@/features/penjualan/filter";

describe("paramUrutanPenjualan", () => {
  it("tanpa urutan: kosong, sehingga backend memakai urutan bawaan", () => {
    expect(paramUrutanPenjualan([])).toEqual({});
  });

  it("kolom yang didukung: sort berisi id kolom dan order dari arah", () => {
    expect(paramUrutanPenjualan([{ id: "totalTagihan", desc: false }])).toEqual({
      sort: "totalTagihan",
      order: "asc",
    });
    expect(paramUrutanPenjualan([{ id: "tanggalTransaksi", desc: true }])).toEqual({
      sort: "tanggalTransaksi",
      order: "desc",
    });
  });

  it("kolom di luar daftar backend tidak dikirim", () => {
    expect(paramUrutanPenjualan([{ id: "statusPenjualan", desc: false }])).toEqual({});
  });

  it("kolom yang diurutkan sama dengan KOLOM_URUT backend yoga", () => {
    expect([...KOLOM_URUT_PENJUALAN].sort()).toEqual(["noReferensi", "tanggalTransaksi", "totalTagihan"]);
  });
});