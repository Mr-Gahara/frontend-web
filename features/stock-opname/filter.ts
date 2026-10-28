import { PANJANG_CARI_SERVER, queryCari, queryLingkup, type LingkupLokasi } from "@/features/inventaris/cakupan";
import type { StatusOpname } from "@/types/stockOpname";

/** Panjang cari terpanjang yang diterima backend (B108). */
export const PANJANG_CARI_OPNAME = PANJANG_CARI_SERVER;

/**
 * Query satu halaman GET /stockopname (paginasi B106, B108, B109): lokasi
 * atau tipe lokasi lingkup, status bila bukan Semua Status, dan pencarian
 * nomorOpname. Seluruhnya disaring server, sehingga pagination.total benar
 * (keputusan rancangan butir 27).
 */
export function paramHalamanOpname(
  lingkup: LingkupLokasi,
  status: StatusOpname | "ALL",
  cari: string,
  halaman: number,
  ukuran: number,
): Record<string, string> {
  return {
    page: String(halaman),
    limit: String(ukuran),
    ...queryLingkup(lingkup),
    ...(status !== "ALL" ? { status } : {}),
    ...queryCari(cari),
  };
}