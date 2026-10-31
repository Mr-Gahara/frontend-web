/**
 * Ruang kerja master shift.
 *
 * Outlet dan gudang punya karyawan, jadwal, dan absensi masing-masing,
 * sehingga shift keduanya terpisah (keputusan SH1b). Sejak backend ridho
 * 7a5ff21 (B168) shift wajib locationID, dan GET /shift menerima
 * ?locationID=. Konstanta penahan KUNCI_LOKASI_SHIFT (keputusan rancangan
 * butir 18) dibuang setelah terisi, karena backend tidak lagi menerima
 * shift tanpa lokasi.
 */
export type RuangShift = "outlet" | "gudang";

/** Query GET /shift untuk lokasi ruang, atau null bila lokasinya belum termuat. */
export function filterDaftarShift(lokasiId: string | null): Record<string, string> | null {
  return lokasiId === null ? null : { locationID: lokasiId };
}