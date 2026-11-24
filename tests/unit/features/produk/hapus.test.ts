import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/error";
import { produkSudahTerhapus } from "@/features/produk/hapus";

describe("produkSudahTerhapus", () => {
  it("hanya 404 yang berarti produk sudah dihapus di tempat lain", () => {
    expect(produkSudahTerhapus(new ApiError(404, "Produk tidak ditemukan."))).toBe(true);
    expect(produkSudahTerhapus(new ApiError(500, "gagal"))).toBe(false);
    expect(produkSudahTerhapus(new ApiError(403, "Akses ditolak"))).toBe(false);
    expect(produkSudahTerhapus(new Error("jaringan"))).toBe(false);
  });
});
