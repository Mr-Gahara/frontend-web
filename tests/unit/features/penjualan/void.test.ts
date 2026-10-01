import { describe, expect, it } from "vitest";
import { susunPayloadVoidPenjualan } from "@/features/penjualan/payload";

describe("susunPayloadVoidPenjualan", () => {
  it("status VOID dengan alasan dipangkas sebagai alasanVoid", () => {
    expect(susunPayloadVoidPenjualan("  salah input  ")).toEqual({
      statusPenjualan: "VOID",
      alasanVoid: "salah input",
    });
  });

  it("alasan kosong tidak dikirim", () => {
    expect(susunPayloadVoidPenjualan("   ")).toEqual({ statusPenjualan: "VOID" });
  });
});