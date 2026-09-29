/**
 * Ruang kerja master shift.
 *
 * Outlet dan gudang punya karyawan, jadwal, dan absensi masing-masing,
 * sehingga shift keduanya harus terpisah (keputusan SH1b). Backend 00b9957
 * belum memisahkannya: shiftModel tidak punya field lokasi, dan GET /shift
 * hanya menyaring status. Tim backend diminta menambah locationID
 * (keputusan SH5a).
 *
 * KUNCI_LOKASI_SHIFT adalah nama field lokasi di query daftar dan payload
 * simpan. Selama null, kedua ruang menampilkan daftar tenant yang sama
 * beserta keterangan, dan payload tidak membawa lokasi. Isi dengan nama
 * field yang ditetapkan backend; aturan di bawah dan di hooks.ts langsung
 * berlaku tanpa perubahan lain (keputusan rancangan butir 18). Ditulis
 * dengan `as` agar TypeScript tidak mempersempit nilainya menjadi null.
 */
export const KUNCI_LOKASI_SHIFT = null as string | null;

export type RuangShift = "outlet" | "gudang";

export function shiftTerpisahPerRuang(): boolean {
  return KUNCI_LOKASI_SHIFT !== null;
}

/**
 * Query GET /shift untuk satu ruang, atau null bila lokasi ruang itu belum
 * termuat. Selama pemisahan belum didukung, query workspace tetap dikirim
 * walau diabaikan backend: GET /shift tanpa query apa pun dijawab 500,
 * karena shiftService.getAll memakai data sebelum dideklarasikan
 * (kontrak/temuan.md butir 8). Query itu dibuang begitu backend
 * memperbaikinya.
 */
export function filterDaftarShift(
  ruang: RuangShift,
  lokasiId: string | null,
): Record<string, string> | null {
  if (KUNCI_LOKASI_SHIFT === null) return { workspace: ruang };
  return lokasiId === null ? null : { [KUNCI_LOKASI_SHIFT]: lokasiId };
}