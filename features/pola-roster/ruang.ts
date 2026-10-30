import type { RuangShift } from "@/features/shift/ruang";

/**
 * Ruang kerja pola roster (keputusan PL5).
 *
 * Outlet dan gudang punya jadwal dan pola kerja masing-masing. Sejak backend
 * ridho 7a5ff21 (B168) pola roster wajib locationID, dan GET /polaroster
 * menerima ?locationID=.
 *
 * KUNCI_LOKASI_POLA_ROSTER adalah nama field lokasi di query daftar dan
 * payload simpan, terpisah dari KUNCI_LOKASI_SHIFT karena backend dapat
 * menambahkannya di waktu yang berbeda. Selama null, kedua ruang
 * menampilkan daftar tenant yang sama beserta keterangan, dan tidak ada
 * query yang dikirim (keputusan rancangan butir 18).
 */
export const KUNCI_LOKASI_POLA_ROSTER = "locationID" as string | null;

export type RuangPolaRoster = RuangShift;

export function polaTerpisahPerRuang(): boolean {
  return KUNCI_LOKASI_POLA_ROSTER !== null;
}

/** Query GET /polaroster, atau null bila lokasi ruang itu belum termuat. */
export function filterDaftarPola(lokasiId: string | null): Record<string, string> | null {
  if (KUNCI_LOKASI_POLA_ROSTER === null) return {};
  return lokasiId === null ? null : { [KUNCI_LOKASI_POLA_ROSTER]: lokasiId };
}