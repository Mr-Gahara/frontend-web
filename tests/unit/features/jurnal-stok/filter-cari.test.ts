import { describe, expect, it } from "vitest";
import { PANJANG_CARI_SERVER } from "@/features/inventaris/cakupan";
import { paramHalamanJurnal } from "@/features/jurnal-stok/filter";

describe("paramHalamanJurnal: pencarian nama bahan (B108)", () => {
  const dasar = { lokasiID: "lok-1", arah: "ALL" as const, alasan: "ALL" as const };

  it("pencarian dipangkas lalu dikirim sebagai cari", () => {
    expect(paramHalamanJurnal({ ...dasar, cari: "  Gula " }, 1, 10)).toEqual({
      locationID: "lok-1",
      cari: "Gula",
      page: "1",
      limit: "10",
    });
  });

  it("pencarian kosong atau spasi saja tidak dikirim", () => {
    expect(paramHalamanJurnal(dasar, 1, 10)).not.toHaveProperty("cari");
    expect(paramHalamanJurnal({ ...dasar, cari: "   " }, 1, 10)).not.toHaveProperty("cari");
  });

  it("pencarian yang panjang dibatasi", () => {
    const panjang = "G".repeat(PANJANG_CARI_SERVER + 3);
    expect(paramHalamanJurnal({ ...dasar, cari: panjang }, 1, 10).cari).toHaveLength(PANJANG_CARI_SERVER);
  });
});