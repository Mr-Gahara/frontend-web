import type { RuangShift } from "@/features/shift/ruang";

/**
 * Ruang kerja pola roster (keputusan PL5).
 *
 * Outlet dan gudang punya jadwal dan pola kerja masing-masing. Sejak backend
 * ridho 7a5ff21 (B168) pola roster wajib locationID, dan GET /polaroster
 * menerima ?locationID=. Konstanta penahan KUNCI_LOKASI_POLA_ROSTER
 * (keputusan rancangan butir 18) dibuang setelah terisi.
 */
export type RuangPolaRoster = RuangShift;

/** Query GET /polaroster, atau null bila lokasi ruang itu belum termuat. */
export function filterDaftarPola(lokasiId: string | null): Record<string, string> | null {
  return lokasiId === null ? null : { locationID: lokasiId };
}