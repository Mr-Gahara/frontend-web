import { keTanggalLokal } from "@/lib/waktu";
import type { AlasanJurnal, JurnalStok, TipeKoreksi } from "@/types/jurnalStok";
import type { FilterJurnalStok } from "./api";

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

/**
 * Filter daftar utuh untuk sebuah lingkup (mode klien). Hanya lingkup satu
 * lokasi yang membawa locationID; lingkup tipe lokasi disaring di klien lewat
 * dalamLingkup. Dipakai sampai halaman jurnal beralih ke paramHalamanJurnal.
 */
export function filterServer(lingkup: LingkupJurnal): FilterJurnalStok {
  return "lokasiID" in lingkup ? { locationID: lingkup.lokasiID } : {};
}

/** Kriteria GET /jurnalstok berhalaman (B102). Server membaca dari dan sampai sebagai hari WIB. */
export interface KriteriaServerJurnal {
  lokasiID: string;
  arah: FilterArah;
  alasan: FilterAlasan;
  dari?: Date;
  sampai?: Date;
}

/**
 * Query satu halaman jurnal: lokasi, filter yang terisi, lalu page dan limit.
 * Pilihan "ALL" dan periode kosong tidak dikirim, karena backend menolak query
 * yang tidak dikenalnya dengan 400.
 */
export function paramHalamanJurnal(
  kriteria: KriteriaServerJurnal,
  halaman: number,
  ukuran: number,
): Record<string, string> {
  return {
    locationID: kriteria.lokasiID,
    ...(kriteria.dari ? { dari: keTanggalLokal(kriteria.dari) } : {}),
    ...(kriteria.sampai ? { sampai: keTanggalLokal(kriteria.sampai) } : {}),
    ...(kriteria.arah !== "ALL" ? { tipeKoreksi: kriteria.arah } : {}),
    ...(kriteria.alasan !== "ALL" ? { alasan: kriteria.alasan } : {}),
    page: String(halaman),
    limit: String(ukuran),
  };
}

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