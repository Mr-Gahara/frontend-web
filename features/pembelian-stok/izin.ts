import { IZIN } from "@/lib/auth/permissions";

export type RuangPembelian = "outlet" | "gudang";

export interface IzinPembelianStok {
  baca: string;
  buat: string;
  ubah: string;
  hapus: string;
}

/**
 * Izin umum, membuka kedua ruang. Sesuai routes/pembelianStokRoute.js backend
 * ridho 877e493 (B74, B116).
 */
export const IZIN_PEMBELIAN_STOK: IzinPembelianStok = {
  baca: IZIN.pembelianStok,
  buat: IZIN.buatPembelianStok,
  ubah: IZIN.ubahPembelianStok,
  hapus: IZIN.hapusPembelianStok,
};

/**
 * Izin pembelian stok per ruang (B116, backend ridho 877e493; kontrak/temuan.md
 * butir 158). Backend menerima izin umum atau izin ruangnya di setiap route;
 * pemegang izin ruang hanya melihat, mencatat, mengubah, dan menghapus
 * pembelian di lokasi bertipe ruangnya, dan dijawab 403 di ruang lain.
 * Template role memakai izin ini, sedangkan izin umum tinggal milik Owner
 * lewat seed.
 */
export const IZIN_PEMBELIAN_STOK_RUANG: Record<RuangPembelian, IzinPembelianStok> = {
  outlet: {
    baca: IZIN.pembelianStokOutlet,
    buat: IZIN.buatPembelianStokOutlet,
    ubah: IZIN.ubahPembelianStokOutlet,
    hapus: IZIN.hapusPembelianStokOutlet,
  },
  gudang: {
    baca: IZIN.pembelianStokGudang,
    buat: IZIN.buatPembelianStokGudang,
    ubah: IZIN.ubahPembelianStokGudang,
    hapus: IZIN.hapusPembelianStokGudang,
  },
};

/**
 * Aksi yang boleh dijalankan pengguna di satu ruang (keputusan rancangan butir
 * 14): izin umum atau izin ruangnya, sama dengan checkPermission backend.
 */
export function aksiPembelianStok(permissions: readonly string[], ruang: RuangPembelian) {
  const ruangnya = IZIN_PEMBELIAN_STOK_RUANG[ruang];
  const boleh = (aksi: keyof IzinPembelianStok) =>
    permissions.includes(IZIN_PEMBELIAN_STOK[aksi]) || permissions.includes(ruangnya[aksi]);
  return { baca: boleh("baca"), buat: boleh("buat"), ubah: boleh("ubah"), hapus: boleh("hapus") };
}
