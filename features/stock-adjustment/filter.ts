import type { LingkupLokasi } from "@/features/inventaris/cakupan";

/** Panjang cari terpanjang yang diterima backend (B108). */
export const PANJANG_CARI_ADJUSTMENT = 100;

/**
 * Query satu halaman GET /stockopname/adjustments (B105, B108, B109).
 * locationID didahulukan; tanpa itu tipe lokasi lingkup dikirim, sehingga
 * backend hanya mengirim adjustment ruang ini dan pagination.total benar
 * (keputusan rancangan butir 27). Pencarian kosong atau spasi saja tidak
 * dikirim.
 */
export function paramHalamanAdjustment(
  lingkup: LingkupLokasi,
  cari: string,
  halaman: number,
  ukuran: number,
): Record<string, string> {
  const params: Record<string, string> = { page: String(halaman), limit: String(ukuran) };
  if (lingkup.locationID) params.locationID = lingkup.locationID;
  else if (lingkup.tipeLokasi) params.tipeLokasi = lingkup.tipeLokasi;
  const kata = cari.trim();
  if (kata) params.cari = kata.slice(0, PANJANG_CARI_ADJUSTMENT);
  return params;
}