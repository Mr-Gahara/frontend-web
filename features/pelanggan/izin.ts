import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin aksi halaman pelanggan, mengikuti checkPermission di
 * routes/pelangganRoute.js backend (keputusan rancangan butir 9 dan 14).
 * GET /pelanggan tidak memeriksa izin.
 */
export const IZIN_PELANGGAN = {
  buat: IZIN.buatPelanggan,
  ubah: IZIN.ubahPelanggan,
  hapus: IZIN.hapusPelanggan,
} as const;

export function aksiPelanggan(permissions: string[]) {
  return {
    buat: permissions.includes(IZIN_PELANGGAN.buat),
    ubah: permissions.includes(IZIN_PELANGGAN.ubah),
    hapus: permissions.includes(IZIN_PELANGGAN.hapus),
  };
}