import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin halaman Mesin Kasir, sesuai routes/sesiKasirRoute.js dan
 * routes/deviceRoute.js backend ridho 1584222.
 *
 * - read-sesi-kasir: kasir yang buka, riwayat, dan rincian (gerbang rute).
 * - kelola-perangkat-kasir: daftar, tambah, ubah, dan lepas mesin kasir, serta
 *   tutup kasir dari web.
 *
 * Form mesin kasir juga membaca perangkat karyawan (GET /pengguna dan
 * GET /device/:userId, read-pengguna) dan laci (GET /akunkas, read-akunkas),
 * sehingga panel mesin kasir dan tombol tutup tampil hanya bila ketiga izin
 * dipegang sekaligus (keputusan pemilik proyek, 7 November 2026). Tanpa salah
 * satunya halaman tampil seperti tanpa izin kelola.
 */
export function bolehKelolaMesinKasir(permissions: readonly string[]): boolean {
  return (
    permissions.includes(IZIN.kelolaPerangkatKasir) &&
    permissions.includes(IZIN.pengguna) &&
    permissions.includes(IZIN.akunKas)
  );
}
