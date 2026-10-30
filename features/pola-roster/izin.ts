import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin halaman pola roster, mengikuti checkPermission di
 * routes/polaRosterRoute.js backend ridho 02b5a60 (B139; keputusan
 * rancangan butir 9 dan 14). Membaca diatur lewat IZIN_HALAMAN.
 */
export function aksiPolaRoster(permissions: string[]) {
  return {
    buat: permissions.includes(IZIN.buatPolaRoster),
    ubah: permissions.includes(IZIN.ubahPolaRoster),
    hapus: permissions.includes(IZIN.hapusPolaRoster),
  };
}
