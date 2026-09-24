import { IZIN } from "@/lib/auth/permissions";

/**
 * Cakupan outlet di daftar penjualan hanya berlaku bagi pemegang
 * read-location (keputusan K11b, 24 September 2026). Tanpa izin itu lokasi
 * tidak dapat dibaca, sehingga pengguna melihat penjualan seluruh tenant;
 * pada MVP satu outlet hasilnya sama dengan outlet tenant. Utang yang wajib
 * ditutup sebelum multi-outlet, dan dilaporkan ke backend: pengguna tenant
 * butuh cara mengetahui outletnya tanpa read-location.
 */
export function bolehCakupanPenjualan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.location);
}