import { describe, expect, it } from "vitest";
import { tautanPenjualanJurnal } from "@/features/jurnal-stok/tampilan";

describe("tautanPenjualanJurnal (B319)", () => {
  it("jurnal Penjualan bertaut ke detail penjualan dengan nomor dari keterangan bawaan", () => {
    expect(
      tautanPenjualanJurnal({
        alasan: "Penjualan",
        penjualanID: "p1",
        keterangan: "Penjualan PJ/20261112/0007: Kopi Susu x3",
      }),
    ).toEqual({ url: "/dashboard/outlet/penjualan/p1", teks: "Lihat penjualan PJ/20261112/0007" });
  });

  it("keterangan yang sudah diubah tetap bertaut tanpa nomor", () => {
    expect(tautanPenjualanJurnal({ alasan: "Penjualan", penjualanID: "p1", keterangan: "dikoreksi" })).toEqual({
      url: "/dashboard/outlet/penjualan/p1",
      teks: "Lihat penjualan",
    });
  });

  it("jurnal lama tanpa penjualanID dan alasan lain tidak bertaut", () => {
    expect(tautanPenjualanJurnal({ alasan: "Lainnya", keterangan: "Penjualan Kopi Susu x3" })).toBeNull();
    expect(tautanPenjualanJurnal({ alasan: "Penjualan", penjualanID: null, keterangan: "Penjualan X: Y x1" })).toBeNull();
    expect(tautanPenjualanJurnal({ alasan: "Pembelian", penjualanID: "p1", keterangan: null })).toBeNull();
  });
});
