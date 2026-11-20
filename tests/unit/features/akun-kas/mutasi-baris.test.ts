import { describe, expect, it } from "vitest";
import { namaAkunBaris, namaPencatat, tautanPenjualanMutasi, tautanTransferMutasi } from "@/features/akun-kas/mutasi";
import type { AkunKas } from "@/types/akunKas";

const daftar = [{ id: "k1", namaAkun: "Kas Kecil" }] as AkunKas[];

describe("baris mutasi sejak backend nizar c29310c (NZ2a)", () => {
  it("nama akun dibaca dari baris, dengan daftar akun sebagai cadangan", () => {
    expect(namaAkunBaris({ akunKasID: "k1", akunKas: { id: "k1", namaAkun: "Nama Dari Baris" } }, daftar)).toBe(
      "Nama Dari Baris",
    );
    expect(namaAkunBaris({ akunKasID: "k1" }, daftar)).toBe("Kas Kecil");
    expect(namaAkunBaris({ akunKasID: "k9", akunKas: null }, undefined)).toBe("Akun tidak dikenal");
  });

  it("pencatat dibaca dari baris, dan tanda hubung bila tidak dikirim", () => {
    expect(namaPencatat({ pengguna: { id: "p1", nama: "Ridho" } })).toBe("Ridho");
    expect(namaPencatat({ pengguna: null })).toBe("-");
    expect(namaPencatat({})).toBe("-");
  });

  it("tautan penjualan hanya untuk mutasi yang membawa penjualanID", () => {
    expect(
      tautanPenjualanMutasi({ referensi: { tipe: "Pembayaran", id: "b1", penjualanID: "j1", noReferensi: "INV/1" } }),
    ).toEqual({ url: "/dashboard/outlet/penjualan/j1", teks: "INV/1" });
    expect(
      tautanPenjualanMutasi({ referensi: { tipe: "Pembayaran", id: "b1", penjualanID: "j1", noReferensi: null } }),
    ).toEqual({ url: "/dashboard/outlet/penjualan/j1", teks: "Lihat penjualan" });
    expect(tautanPenjualanMutasi({ referensi: { tipe: "JurnalTransfer", id: "t1" } })).toBeNull();
  });
});

describe("tautan mutasi transfer ke rincian Pindah Dana", () => {
  it("keempat jenis transfer bertaut lewat referensi JurnalTransfer bila pengguna boleh membaca transfer", () => {
    expect(tautanTransferMutasi({ referensi: { tipe: "JurnalTransfer", id: "t1" } }, true)).toEqual({
      url: "/dashboard/outlet/keuangan/akunkas/pindahDana?transfer=t1",
      teks: "Lihat transfer",
    });
  });

  it("tanpa read-jurnal-transfer, tanpa id, atau referensi lain tidak bertaut", () => {
    expect(tautanTransferMutasi({ referensi: { tipe: "JurnalTransfer", id: "t1" } }, false)).toBeNull();
    expect(tautanTransferMutasi({ referensi: { tipe: "JurnalTransfer", id: null } }, true)).toBeNull();
    expect(tautanTransferMutasi({ referensi: { tipe: "Pembayaran", id: "b1", penjualanID: "j1" } }, true)).toBeNull();
    expect(tautanTransferMutasi({ referensi: { tipe: null, id: null } }, true)).toBeNull();
  });
});
