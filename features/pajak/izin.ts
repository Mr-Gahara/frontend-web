import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin halaman pajak, mengikuti checkPermission di routes/pajakRoute.js dan
 * routes/produkPajakRoute.js backend fc29433 (keputusan rancangan butir 9
 * dan 14). Membaca pajak diatur lewat IZIN_HALAMAN (read-pajak atau
 * akses-pos); memasang dan melepas pajak produk memakai update-produk,
 * karena backend memperlakukannya sebagai bagian dari mengedit produk.
 */
export const URL_PAJAK = "/dashboard/outlet/pengaturan/pajak";

export const IZIN_PAJAK = {
  buat: IZIN.buatPajak,
  ubah: IZIN.ubahPajak,
  hapus: IZIN.hapusPajak,
  pasang: IZIN.ubahProduk,
} as const;

export function aksiPajak(permissions: string[]) {
  return {
    buat: permissions.includes(IZIN_PAJAK.buat),
    ubah: permissions.includes(IZIN_PAJAK.ubah),
    hapus: permissions.includes(IZIN_PAJAK.hapus),
    pasang: permissions.includes(IZIN_PAJAK.pasang),
  };
}