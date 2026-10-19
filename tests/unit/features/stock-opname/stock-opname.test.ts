import { describe, expect, it } from "vitest";
import { isiAwalHitungan, petakanNilaiServer, susunPayloadHitungan } from "@/features/stock-opname/payload";
import { bolehHitungOpname, bolehTinjauOpname } from "@/features/stock-opname/izin";

describe("susunPayloadHitungan", () => {
  const server = {
    a: { qtyPhysical: null, catatanItem: null },
    b: { qtyPhysical: 10, catatanItem: "sudah dihitung" },
    c: { qtyPhysical: 0, catatanItem: null },
  };

  it("hanya mengirim item dan field yang berubah", () => {
    expect(
      susunPayloadHitungan(
        {
          a: { qtyPhysical: "12", catatanItem: "" },
          b: { qtyPhysical: "10", catatanItem: "  perlu dicek ulang  " },
          c: { qtyPhysical: "0", catatanItem: "" },
        },
        server,
      ),
    ).toEqual({
      items: [
        { itemId: "a", qtyPhysical: 12 },
        { itemId: "b", catatanItem: "perlu dicek ulang" },
      ],
    });
  });

  it("mengirim null untuk hitungan yang dikosongkan (butir 22, B98)", () => {
    expect(
      susunPayloadHitungan(
        {
          a: { qtyPhysical: "", catatanItem: "belum sempat" },
          b: { qtyPhysical: " ", catatanItem: "sudah dihitung" },
          c: { qtyPhysical: "0", catatanItem: "" },
        },
        server,
      ),
    ).toEqual({
      items: [
        { itemId: "a", catatanItem: "belum sempat" },
        { itemId: "b", qtyPhysical: null },
      ],
    });
  });

  it("mengirim string kosong untuk catatan yang dihapus", () => {
    expect(susunPayloadHitungan({ b: { qtyPhysical: "10", catatanItem: "   " } }, server).items).toEqual([
      { itemId: "b", catatanItem: "" },
    ]);
  });

  it("tidak mengirim apa pun bila tidak ada perubahan", () => {
    expect(susunPayloadHitungan({ a: { qtyPhysical: " ", catatanItem: "" } }, server)).toEqual({ items: [] });
  });
});

describe("isiAwalHitungan", () => {
  it("mengubah hitungan dan catatan server menjadi isian teks", () => {
    expect(
      isiAwalHitungan([
        { itemId: "a", qtyPhysical: 5, catatanItem: "rusak" },
        { itemId: "b", qtyPhysical: 0, catatanItem: null },
        { itemId: "c", qtyPhysical: null, catatanItem: null },
      ]),
    ).toEqual({
      a: { qtyPhysical: "5", catatanItem: "rusak" },
      b: { qtyPhysical: "0", catatanItem: "" },
      c: { qtyPhysical: "", catatanItem: "" },
    });
  });

  it("menghasilkan isian kosong untuk dokumen tanpa item", () => {
    expect(isiAwalHitungan([])).toEqual({});
  });
});

describe("petakanNilaiServer", () => {
  it("memetakan item menurut itemId dan menyeragamkan nilai kosong menjadi null", () => {
    expect(
      petakanNilaiServer([
        { itemId: "a", qtyPhysical: 5, catatanItem: "x" },
        { itemId: "b" },
      ]),
    ).toEqual({
      a: { qtyPhysical: 5, catatanItem: "x" },
      b: { qtyPhysical: null, catatanItem: null },
    });
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