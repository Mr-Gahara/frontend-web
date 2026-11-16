import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin halaman Mesin Kasir, sesuai routes/sesiKasirRoute.js backend ridho
 * 4a19be8.
 *
 * - read-sesi-kasir: kasir yang buka, riwayat, dan rincian (gerbang rute).
 * - kelola-perangkat-kasir: daftar, tambah, ubah, dan lepas mesin kasir,
 *   perangkat se-toko (GET /sesikasir/perangkat-toko, B334), serta tutup
 *   kasir dari web.
 *
 * Form mesin kasir juga membaca laci (GET /akunkas, read-akunkas), sehingga
 * panel mesin kasir dan tombol tutup tampil hanya bila kedua izin dipegang
 * sekaligus (keputusan pemilik proyek, 7 November 2026). read-pengguna tidak
 * lagi diperlukan sejak perangkat dibaca dari daftar se-toko (MK3b, 16
 * November 2026). Tanpa salah satunya halaman tampil seperti tanpa izin
 * kelola.
 */
export function bolehKelolaMesinKasir(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.kelolaPerangkatKasir) && permissions.includes(IZIN.akunKas);
}
