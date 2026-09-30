import { describe, expect, it } from "vitest";
import { namaTipeAset } from "@/features/aset/tampilan";

describe("namaTipeAset", () => {
  it("nama tipe aset dari respons", () => {
    expect(namaTipeAset({ dataAset: { namaTipeAset: "Meja Billiard" } })).toBe("Meja Billiard");
  });

  it("aset yang tipe asetnya sudah tidak ada tampil Tipe Tidak Diketahui", () => {
    expect(namaTipeAset({ dataAset: null })).toBe("Tipe Tidak Diketahui");
    expect(namaTipeAset({ dataAset: { namaTipeAset: null } })).toBe("Tipe Tidak Diketahui");
  });
});