/**
 * Ruang kerja master shift.
 *
 * Outlet dan gudang punya karyawan, jadwal, dan absensi masing-masing,
 * sehingga shift keduanya harus terpisah (keputusan SH1b). Sejak backend
 * ridho 7a5ff21 (B168) shift wajib locationID, dan GET /shift menerima
 * ?locationID=.
 *
 * KUNCI_LOKASI_SHIFT adalah nama field lokasi di query daftar dan payload
 * simpan. Selama null, kedua ruang menampilkan daftar tenant yang sama
 * beserta keterangan, dan payload tidak membawa lokasi (keputusan rancangan
 * butir 18). Ditulis dengan `as` agar TypeScript tidak mempersempit
 * nilainya.
 */
export const KUNCI_LOKASI_SHIFT = "locationID" as string | null;

export type RuangShift = "outlet" | "gudang";

export function shiftTerpisahPerRuang(): boolean {
  return KUNCI_LOKASI_SHIFT !== null;
}

/**
 * Query GET /shift untuk satu ruang, atau null bila lokasi ruang itu belum
 * termuat. Cabang workspace hanya untuk KUNCI_LOKASI_SHIFT null: dulu GET
 * /shift tanpa query dijawab 500 (kontrak/temuan.md butir 8, diperbaiki
 * backend di B126).
 */
export function filterDaftarShift(
  ruang: RuangShift,
  lokasiId: string | null,
): Record<string, string> | null {
  if (KUNCI_LOKASI_SHIFT === null) return { workspace: ruang };
  return lokasiId === null ? null : { [KUNCI_LOKASI_SHIFT]: lokasiId };
}