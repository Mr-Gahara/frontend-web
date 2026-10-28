import { describe, expect, it } from "vitest";
import { PANJANG_CARI_OPNAME, paramHalamanOpname } from "@/features/stock-opname/filter";

describe("paramHalamanOpname", () => {
  it("Semua Status tidak mengirim status; lingkup bertipe dikirim sebagai tipeLokasi", () => {
    expect(paramHalamanOpname({ tipeLokasi: "Gudang" }, "ALL", "", 1, 10)).toEqual({
      page: "1",
      limit: "10",
      tipeLokasi: "Gudang",
    });
  });

  it("satu lokasi, status, dan pencarian dikirim bersama", () => {
    expect(paramHalamanOpname({ locationID: "lok-1" }, "DRAFT", " OPN-2026 ", 3, 20)).toEqual({
      page: "3",
      limit: "20",
      locationID: "lok-1",
      status: "DRAFT",
      cari: "OPN-2026",
    });
  });

  it("pencarian spasi saja tidak dikirim, dan yang panjang dibatasi", () => {
    expect(paramHalamanOpname({ tipeLokasi: "Outlet" }, "ALL", "   ", 1, 10)).not.toHaveProperty("cari");
    const panjang = "O".repeat(PANJANG_CARI_OPNAME + 1);
    expect(paramHalamanOpname({ tipeLokasi: "Outlet" }, "ALL", panjang, 1, 10).cari).toHaveLength(PANJANG_CARI_OPNAME);
  });
});