import { describe, expect, it } from "vitest";
import { queryKeys } from "@/lib/queryKeys";

/**
 * React Query mencocokkan kunci secara prefix: invalidateQueries pada
 * ["produk"] membatalkan ["produk", "detail", "1"]. Test ini memastikan
 * setiap varian benar-benar berada di bawah akar domainnya.
 */
const berawalanDengan = (kunci: readonly unknown[], akar: readonly unknown[]) =>
  akar.every((bagian, i) => kunci[i] === bagian);

describe("hierarki kunci", () => {
  it("detail berada di bawah akar domainnya", () => {
    expect(berawalanDengan(queryKeys.produk.detail("p1"), queryKeys.produk.semua)).toBe(true);
    expect(berawalanDengan(queryKeys.penjualan.detail("s1"), queryKeys.penjualan.semua)).toBe(true);
    expect(berawalanDengan(queryKeys.bahanBaku.detail("b1"), queryKeys.bahanBaku.semua)).toBe(true);
  });

  it("daftar berada di bawah akar domainnya", () => {
    expect(berawalanDengan(queryKeys.inventory.daftar({ locationID: "l1" }), queryKeys.inventory.semua)).toBe(true);
    expect(berawalanDengan(queryKeys.lokasi.daftar({ tipe: "Outlet" }), queryKeys.lokasi.semua)).toBe(true);
  });

  it("varian lokasi aktif berada di bawah akar lokasi", () => {
    // Sebelumnya lokasi aktif memakai kunci terpisah
    // ["lokasi-current-active-tenant"], sehingga tidak ikut terinvalidasi.
    expect(berawalanDengan(queryKeys.lokasi.aktif(), queryKeys.lokasi.semua)).toBe(true);
  });

  it("filter berbeda menghasilkan kunci berbeda", () => {
    const a = queryKeys.inventory.daftar({ locationID: "outlet" });
    const b = queryKeys.inventory.daftar({ locationID: "gudang" });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("filter sama menghasilkan kunci sama", () => {
    const a = queryKeys.pengguna.daftar("outlet");
    const b = queryKeys.pengguna.daftar("outlet");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("setiap domain memiliki akar bersegmen tunggal", () => {
    for (const [nama, domain] of Object.entries(queryKeys)) {
      const akar = (domain as { semua: readonly unknown[] }).semua;
      expect(akar.length, nama).toBe(1);
      expect(typeof akar[0], nama).toBe("string");
    }
  });
});
