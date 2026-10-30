import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin halaman shift, mengikuti checkPermission di routes/shiftRoute.js
 * backend ridho 02b5a60 (B139; keputusan rancangan butir 9 dan 14).
 * Membaca diatur lewat IZIN_HALAMAN; menonaktifkan shift memakai DELETE,
 * sehingga menuntut delete-shift.
 */
export function aksiShift(permissions: string[]) {
  return {
    buat: permissions.includes(IZIN.buatShift),
    ubah: permissions.includes(IZIN.ubahShift),
    nonaktifkan: permissions.includes(IZIN.hapusShift),
  };
}
