import { IZIN } from "@/lib/auth/permissions";

export type RuangPembelian = "outlet" | "gudang";

export interface IzinPembelianStok {
  baca: string;
  buat: string;
  ubah: string;
  hapus: string;
}

/** Izin umum, sesuai routes/pembelianStokRoute.js backend ridho b5b367a (B74). */
export const IZIN_PEMBELIAN_STOK: IzinPembelianStok = {
  baca: IZIN.pembelianStok,
  buat: IZIN.buatPembelianStok,
  ubah: IZIN.ubahPembelianStok,
  hapus: IZIN.hapusPembelianStok,
};

/**
 * Izin pembelian stok per ruang (keputusan rancangan butir 18). Backend
 * belum membedakan pembelian di outlet dan di gudang, dan POST menerima
 * lokasi penerima mana pun milik tenant; pembedaannya diminta ke tim
 * backend (pemilik proyek, 25 Oktober 2026). Selama null, kedua ruang
 * memakai izin umum. Isi dengan nama dari seeder permission backend begitu
 * tersedia; tombol dan data di dalam halaman langsung mengikutinya. Syarat
 * gerbang rute di IZIN_HALAMAN ikut diganti saat itu, karena IZIN_HALAMAN
 * hanya menerima nama yang ada di IZIN.
 */
export const IZIN_PEMBELIAN_STOK_RUANG: Record<RuangPembelian, IzinPembelianStok> | null = null;

/** Nama izin yang berlaku di satu ruang; izin umum selama izin per ruang belum ditetapkan. */
export function izinPembelianStok(
  ruang: RuangPembelian,
  peta: Record<RuangPembelian, IzinPembelianStok> | null = IZIN_PEMBELIAN_STOK_RUANG,
): IzinPembelianStok {
  return peta?.[ruang] ?? IZIN_PEMBELIAN_STOK;
}

/** Aksi yang boleh dijalankan pengguna di satu ruang (keputusan rancangan butir 14). */
export function aksiPembelianStok(
  permissions: readonly string[],
  ruang: RuangPembelian,
  peta: Record<RuangPembelian, IzinPembelianStok> | null = IZIN_PEMBELIAN_STOK_RUANG,
) {
  const izin = izinPembelianStok(ruang, peta);
  return {
    baca: permissions.includes(izin.baca),
    buat: permissions.includes(izin.buat),
    ubah: permissions.includes(izin.ubah),
    hapus: permissions.includes(izin.hapus),
  };
}