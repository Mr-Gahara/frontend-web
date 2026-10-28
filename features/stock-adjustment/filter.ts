import { PANJANG_CARI_SERVER, queryCari, queryLingkup, type LingkupLokasi } from "@/features/inventaris/cakupan";

/** Panjang cari terpanjang yang diterima backend (B108). */
export const PANJANG_CARI_ADJUSTMENT = PANJANG_CARI_SERVER;

/**
 * Query satu halaman GET /stockopname/adjustments (paginasi B106, B108,
 * B109): lokasi atau tipe lokasi lingkup dan pencarian nomorAdjustment,
 * seluruhnya disaring server, sehingga pagination.total benar (keputusan
 * rancangan butir 27).
 */
export function paramHalamanAdjustment(
  lingkup: LingkupLokasi,
  cari: string,
  halaman: number,
  ukuran: number,
): Record<string, string> {
  return { page: String(halaman), limit: String(ukuran), ...queryLingkup(lingkup), ...queryCari(cari) };
}
