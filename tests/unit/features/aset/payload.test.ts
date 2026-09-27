import { describe, expect, it } from "vitest";
import { payloadAset } from "@/features/aset/payload";

describe("payload aset", () => {
  it("nama dipangkas dan tipe aset serta status dikirim", () => {
    expect(payloadAset({ namaAset: "  Meja 01  ", tipeAsetID: "t1", status: "perbaikan" })).toEqual({
      namaAset: "Meja 01",
      tipeAsetID: "t1",
      status: "perbaikan",
    });
  });

  it("status tersedia dikirim", () => {
    expect(payloadAset({ namaAset: "Meja", tipeAsetID: "t1", status: "tersedia" }).status).toBe(
      "tersedia",
    );
  });

  it("status digunakan tidak dikirim karena dihitung backend", () => {
    const hasil = payloadAset({ namaAset: "Meja", tipeAsetID: "t1", status: "digunakan" });
    expect(hasil).toEqual({ namaAset: "Meja", tipeAsetID: "t1" });
    expect(hasil).not.toHaveProperty("status");
  });
});