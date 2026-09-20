import type { AlasanJurnal, JurnalStok, TipeKoreksi } from "@/types/jurnalStok";

export type FilterArah = TipeKoreksi | "ALL";
export type FilterAlasan = AlasanJurnal | "ALL";

export interface KriteriaJurnal {
  cari: string;
  arah: FilterArah;
  alasan: FilterAlasan;
}

/**
 * Cakupan halaman: outlet memakai satu lokasi aktif, gudang memakai semua
 * lokasi bertipe Gudang. Backend mengirim jurnal seluruh tenant.
 */
export type LingkupJurnal = { lokasiID: string } | { tipeLokasi: string };

export function dalamLingkup(jurnal: JurnalStok, lingkup: LingkupJurnal): boolean {
  if ("lokasiID" in lingkup) return jurnal.locationID?.id === lingkup.lokasiID;
  return jurnal.locationID?.tipe === lingkup.tipeLokasi;
}

/** Menyaring dan mengurutkan dari yang terbaru, tanpa mengubah array masukan. */
export function saringJurnal(
  daftar: JurnalStok[],
  lingkup: LingkupJurnal,
  kriteria: KriteriaJurnal,
): JurnalStok[] {
  const cari = kriteria.cari.trim().toLowerCase();
  return daftar
    .filter((j) => dalamLingkup(j, lingkup))
    .filter(
      (j) =>
        !cari || (j.bahanBakuID?.namaBahan.toLowerCase().includes(cari) ?? false),
    )
    .filter((j) => kriteria.arah === "ALL" || j.tipeKoreksi === kriteria.arah)
    .filter((j) => kriteria.alasan === "ALL" || j.alasan === kriteria.alasan)
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
}