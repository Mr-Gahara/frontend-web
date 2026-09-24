import { describe, expect, it } from "vitest";
import { lokasiFinalisasi, susunPayloadFinalisasi } from "@/features/penjualan/payload";
import { pembayaranPenjualan } from "@/features/pembayaran/filter";
import { namaMetode } from "@/features/metode-pembayaran/filter";
import type { Pembayaran } from "@/types/pembayaran";
import type { MetodePembayaran } from "@/types/metodePembayaran";

function bayar(id: string, penjualanID: string | null): Pembayaran {
  return {
    id,
    tenantID: "t",
    akunKasID: "k",
    penjualanID,
    metodePembayaranID: "m1",
    noReferensi: "INV",
    tanggalBayar: null,
    gatewayPaymentID: null,
    qrString: null,
    jumlahBayar: 1000,
    status: "PAID",
    catatan: null,
    createdAt: "",
    updatedAt: "",
  };
}

const metode: MetodePembayaran[] = [
  {
    id: "m1",
    tenantID: "t",
    akunKas: null,
    namaPembayaran: "Tunai",
    kategori: "tunai",
    isActive: true,
    createdAt: "",
    updatedAt: "",
  },
];

describe("lokasiFinalisasi dan susunPayloadFinalisasi", () => {
  it("lokasi penjualan lebih dulu, lalu outlet tenant", () => {
    expect(lokasiFinalisasi("lokasi-penjualan", "outlet")).toBe("lokasi-penjualan");
    expect(lokasiFinalisasi(null, "outlet")).toBe("outlet");
  });

  it("tanpa keduanya locationID tidak dikirim, agar backend memakai cadangannya", () => {
    expect(lokasiFinalisasi(null, "")).toBeUndefined();
    expect(susunPayloadFinalisasi(undefined)).toEqual({ finalize: true });
    expect(susunPayloadFinalisasi("outlet")).toEqual({ finalize: true, locationID: "outlet" });
  });
});

describe("pembayaranPenjualan", () => {
  it("hanya pembayaran milik penjualan itu, urutan dipertahankan", () => {
    const daftar = [bayar("1", "p1"), bayar("2", "p2"), bayar("3", "p1"), bayar("4", null)];
    expect(pembayaranPenjualan(daftar, "p1").map((p) => p.id)).toEqual(["1", "3"]);
  });
});

describe("namaMetode", () => {
  it("nama metode sesuai id", () => {
    expect(namaMetode(metode, "m1")).toBe("Tunai");
  });

  it("strip bila daftar belum ada, id kosong, atau metode terhapus", () => {
    expect(namaMetode(undefined, "m1")).toBe("-");
    expect(namaMetode(metode, null)).toBe("-");
    expect(namaMetode(metode, "m-terhapus")).toBe("-");
  });
});