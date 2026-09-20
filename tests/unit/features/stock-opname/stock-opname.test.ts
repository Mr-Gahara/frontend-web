import { describe, expect, it } from "vitest";
import { susunPayloadHitungan } from "@/features/stock-opname/payload";
import { bolehHitungOpname, bolehTinjauOpname } from "@/features/stock-opname/izin";

describe("susunPayloadHitungan", () => {
  it("hanya mengirim item yang hitungannya terisi", () => {
    const payload = susunPayloadHitungan({
      a: { qtyPhysical: "12", catatanItem: "" },
      b: { qtyPhysical: "", catatanItem: "belum dihitung" },
      c: { qtyPhysical: "0", catatanItem: "" },
    });
    expect(payload).toEqual({
      items: [
        { itemId: "a", qtyPhysical: 12 },
        { itemId: "c", qtyPhysical: 0 },
      ],
    });
  });

  it("merapikan catatan dan tidak mengirim catatan kosong", () => {
    const payload = susunPayloadHitungan({
      a: { qtyPhysical: "5", catatanItem: "  kemasan rusak  " },
      b: { qtyPhysical: "7", catatanItem: "   " },
    });
    expect(payload.items).toEqual([
      { itemId: "a", qtyPhysical: 5, catatanItem: "kemasan rusak" },
      { itemId: "b", qtyPhysical: 7 },
    ]);
  });

  it("menghasilkan daftar kosong bila belum ada hitungan", () => {
    expect(susunPayloadHitungan({ a: { qtyPhysical: " ", catatanItem: "" } })).toEqual({ items: [] });
  });
});

describe("izin stock opname", () => {
  it("memisahkan izin menghitung dari izin meninjau", () => {
    expect(bolehHitungOpname(["submit-stock-opname"])).toBe(true);
    expect(bolehTinjauOpname(["submit-stock-opname"])).toBe(false);
    expect(bolehTinjauOpname(["review-stock-opname"])).toBe(true);
    expect(bolehHitungOpname([])).toBe(false);
  });
});