import { describe, expect, it } from "vitest";
import { paramHalamanProduk } from "@/features/produk/filter";

describe("paramHalamanProduk (PV1a, P79, B340)", () => {
  it("halaman dan ukuran selalu dikirim; cari dipangkas, kosong tidak dikirim", () => {
    expect(paramHalamanProduk("", false, 1, 10)).toEqual({ page: "1", limit: "10" });
    expect(paramHalamanProduk("  kopi ", false, 2, 20)).toEqual({ page: "2", limit: "20", cari: "kopi" });
  });

  it("tab Stok Kritis mengirim stokKritis=true", () => {
    expect(paramHalamanProduk("", true, 1, 10)).toEqual({ page: "1", limit: "10", stokKritis: "true" });
  });

  it("cari dipotong 100 karakter, batas backend", () => {
    expect(paramHalamanProduk("a".repeat(150), false, 1, 10).cari).toHaveLength(100);
  });
});
