import { queryCari } from "@/features/inventaris/cakupan";

/** Pilihan baris per halaman daftar produk. */
export const PILIHAN_UKURAN_PRODUK = [10, 20, 50] as const;

/**
 * Query satu halaman GET /produk (P79, B340): pencarian nama dan tab stok
 * kritis disaring server bersama paginasinya (keputusan rancangan butir 27).
 */
export function paramHalamanProduk(
  cari: string,
  kritis: boolean,
  halaman: number,
  ukuran: number,
): Record<string, string> {
  return {
    page: String(halaman),
    limit: String(ukuran),
    ...queryCari(cari),
    ...(kritis ? { stokKritis: "true" } : {}),
  };
}
