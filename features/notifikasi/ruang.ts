import type { RuangKerja } from "@/features/pengguna/lokasi-kerja";

/*
 * Sumber lonceng mengikuti lokasi kerja staf (LN20a; pemilik proyek,
 * 25 November 2026). Staf berlokasi kerja hanya membuka ruang lokasinya
 * (LK3a), sehingga sumber ruang lain tidak dimuat: permintaannya ditolak
 * backend dan kartunya mengarah ke ruang yang tertutup. Sumber tingkat toko
 * tetap dimuat bagi siapa pun.
 */

/** Ruang sebuah sumber lonceng; "toko" berlaku di kedua ruang. */
export type RuangSumber = RuangKerja | "toko";

/** Ruang lokasi kerja pengguna sesi, seperti dikembalikan useRuangLokasiKerja. */
export interface LokasiKerjaSesi {
  ruang: RuangKerja | null;
  siap: boolean;
}

/**
 * Sumber boleh dimuat. Sumber tingkat toko tidak menunggu apa pun; sumber
 * outlet dan gudang menunggu detail diri (siap), agar staf berlokasi kerja
 * tidak sempat meminta sumber ruang lain. Owner, pemegang
 * akses-lintas-outlet, dan staf tanpa lokasi kerja (ruang null) memuat
 * kedua ruang.
 */
export function muatRuang(lokasiKerja: LokasiKerjaSesi, sumber: RuangSumber): boolean {
  if (sumber === "toko") return true;
  if (!lokasiKerja.siap) return false;
  return lokasiKerja.ruang === null || lokasiKerja.ruang === sumber;
}

/**
 * Ringkasan dashboard yang dimuat untuk sumber inventaris (LN17a, LN20a).
 * Ringkasan outlet dipakai pemegang izin dashboard outlet yang boleh memuat
 * ruang outlet; ringkasan gudang dipakai bila ringkasan outlet tidak dimuat,
 * termasuk staf gudang yang memegang izin dashboard outlet, agar pengajuan
 * dan surat jalan tetap terbaca dari ruangnya sendiri.
 */
export function ringkasanDimuat(
  izin: { dashboardOutlet: boolean; dashboardGudang: boolean },
  muat: (sumber: RuangSumber) => boolean,
): { outlet: boolean; gudang: boolean } {
  const outlet = izin.dashboardOutlet && muat("outlet");
  const gudang = !outlet && izin.dashboardGudang && muat("gudang");
  return { outlet, gudang };
}
