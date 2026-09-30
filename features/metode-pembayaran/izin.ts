/**
 * Izin tulis metode pembayaran, sesuai route backend 465b438 (keputusan
 * rancangan butir 14). Membaca daftar dan detail cukup login, sehingga
 * halaman tidak diberi syarat izin; aktifkan dan nonaktifkan memakai izin
 * ubah, karena keduanya lewat PUT.
 */
export const IZIN_METODE_PEMBAYARAN = {
  buat: "create-metode-pembayaran",
  ubah: "update-metode-pembayaran",
} as const;

export function aksiMetodePembayaran(permissions: readonly string[]) {
  return {
    buat: permissions.includes(IZIN_METODE_PEMBAYARAN.buat),
    ubah: permissions.includes(IZIN_METODE_PEMBAYARAN.ubah),
  };
}