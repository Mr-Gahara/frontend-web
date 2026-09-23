import { describe, expect, it } from "vitest";
import { isiAwalHitungan, petakanNilaiServer, susunPayloadHitungan } from "@/features/stock-opname/payload";
import { bolehHitungOpname, bolehTinjauOpname } from "@/features/stock-opname/izin";

describe("susunPayloadHitungan", () => {
  const server = {
    a: { qtyPhysical: null, catatanItem: null },
    b: { qtyPhysical: 10, catatanItem: "sudah dihitung" },
    c: { qtyPhysical: 0, catatanItem: null },
  };

  describe("selama server belum menerima hitungan kosong", () => {
    it("hanya mengirim item yang berubah, selalu dengan hitungannya", () => {
      const hasil = susunPayloadHitungan(
        {
          a: { qtyPhysical: "12", catatanItem: "" },
          b: { qtyPhysical: "10", catatanItem: "  perlu dicek ulang  " },
          c: { qtyPhysical: "0", catatanItem: "" },
        },
        server,
      );
      expect(hasil).toEqual({
        payload: {
          items: [
            { itemId: "a", qtyPhysical: 12 },
            { itemId: "b", qtyPhysical: 10, catatanItem: "perlu dicek ulang" },
          ],
        },
        ditahan: [],
      });
    });

    it("menahan item berubah yang hitungannya kosong", () => {
      const hasil = susunPayloadHitungan(
        {
          a: { qtyPhysical: "", catatanItem: "belum sempat" },
          b: { qtyPhysical: " ", catatanItem: "sudah dihitung" },
        },
        server,
      );
      expect(hasil).toEqual({ payload: { items: [] }, ditahan: ["a", "b"] });
    });

    it("mengirim string kosong untuk catatan yang dihapus", () => {
      expect(
        susunPayloadHitungan({ b: { qtyPhysical: "10", catatanItem: "   " } }, server).payload.items,
      ).toEqual([{ itemId: "b", qtyPhysical: 10, catatanItem: "" }]);
    });

    it("tidak mengirim dan tidak menahan apa pun bila tidak ada perubahan", () => {
      expect(
        susunPayloadHitungan({ a: { qtyPhysical: " ", catatanItem: "" } }, server),
      ).toEqual({ payload: { items: [] }, ditahan: [] });
    });
  });

  describe("setelah server menerima hitungan kosong", () => {
    it("mengirim null untuk hitungan yang dikosongkan dan hanya field yang berubah", () => {
      const hasil = susunPayloadHitungan(
        {
          a: { qtyPhysical: "", catatanItem: "belum sempat" },
          b: { qtyPhysical: " ", catatanItem: "sudah dihitung" },
          c: { qtyPhysical: "0", catatanItem: "" },
        },
        server,
        true,
      );
      expect(hasil).toEqual({
        payload: {
          items: [
            { itemId: "a", catatanItem: "belum sempat" },
            { itemId: "b", qtyPhysical: null },
          ],
        },
        ditahan: [],
      });
    });
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