/**
 * Izin aksi halaman diskon, mengikuti checkPermission di
 * routes/diskonRoute.js backend (keputusan rancangan butir 9 dan 14).
 * GET /diskon tidak memeriksa izin, dan tidak ada DELETE: diskon dihentikan
 * lewat PUT status, sehingga aktifkan dan nonaktifkan mengikuti izin ubah.
 */
export const IZIN_DISKON = {
  buat: "create-diskon",
  ubah: "update-diskon",
} as const;

export function aksiDiskon(permissions: string[]) {
  return {
    buat: permissions.includes(IZIN_DISKON.buat),
    ubah: permissions.includes(IZIN_DISKON.ubah),
  };
}