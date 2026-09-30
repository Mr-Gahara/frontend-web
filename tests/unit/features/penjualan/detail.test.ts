import { describe, expect, it } from "vitest";
import { lokasiFinalisasi, susunPayloadFinalisasi } from "@/features/penjualan/payload";
import { bolehBatalkanPembayaran, IZIN_PENJUALAN } from "@/features/penjualan/izin";


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

describe("bolehBatalkanPembayaran", () => {
  const semua = Object.values(IZIN_PENJUALAN);

  it("hanya pembayaran PAID, bagi pemegang update-pembayaran", () => {
    expect(bolehBatalkanPembayaran({ status: "PAID" }, semua)).toBe(true);
    expect(bolehBatalkanPembayaran({ status: "VOID" }, semua)).toBe(false);
    expect(bolehBatalkanPembayaran({ status: "PENDING" }, semua)).toBe(false);
    expect(bolehBatalkanPembayaran({ status: "PAID" }, [IZIN_PENJUALAN.bayar])).toBe(false);
  });
});