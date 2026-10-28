import { describe, expect, it } from "vitest";
import { PANJANG_CARI_ADJUSTMENT, paramHalamanAdjustment } from "@/features/stock-adjustment/filter";

describe("paramHalamanAdjustment", () => {
  it("satu lokasi dikirim sebagai locationID", () => {
    expect(paramHalamanAdjustment({ locationID: "lok-1" }, "", 1, 10)).toEqual({
      page: "1",
      limit: "10",
      locationID: "lok-1",
    });
  });

  it("lingkup bertipe dikirim sebagai tipeLokasi (B109)", () => {
    expect(paramHalamanAdjustment({ tipeLokasi: "Gudang" }, "", 2, 20)).toEqual({
      page: "2",
      limit: "20",
      tipeLokasi: "Gudang",
    });
  });

  it("locationID didahulukan bila lingkup membawa keduanya", () => {
    expect(paramHalamanAdjustment({ locationID: "lok-1", tipeLokasi: "Outlet" }, "", 1, 10)).toEqual({
      page: "1",
      limit: "10",
      locationID: "lok-1",
    });
  });

  it("pencarian dipangkas, yang kosong tidak dikirim, dan panjangnya dibatasi (B108)", () => {
    expect(paramHalamanAdjustment({ tipeLokasi: "Outlet" }, "  ADJ-01 ", 1, 10).cari).toBe("ADJ-01");
    expect(paramHalamanAdjustment({ tipeLokasi: "Outlet" }, "   ", 1, 10)).not.toHaveProperty("cari");
    const panjang = "A".repeat(PANJANG_CARI_ADJUSTMENT + 5);
    expect(paramHalamanAdjustment({ tipeLokasi: "Outlet" }, panjang, 1, 10).cari).toHaveLength(PANJANG_CARI_ADJUSTMENT);
  });
});