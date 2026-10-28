import { queryCari } from "@/features/inventaris/cakupan";
import { keTanggalLokal } from "@/lib/waktu";
import type { AlasanJurnal, TipeKoreksi } from "@/types/jurnalStok";

export type FilterArah = TipeKoreksi | "ALL";
export type FilterAlasan = AlasanJurnal | "ALL";

/** Periode awal halaman jurnal: tanggal 1 bulan berjalan sampai hari ini, sama dengan mutasi arus kas. */
export function periodeAwalJurnal(sekarang: Date = new Date()): { dari: Date; sampai: Date } {
  return {
    dari: new Date(sekarang.getFullYear(), sekarang.getMonth(), 1),
    sampai: new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()),
  };
}

/** Kriteria GET /jurnalstok berhalaman (B102). Server membaca dari dan sampai sebagai hari WIB. */
export interface KriteriaServerJurnal {
  lokasiID: string;
  arah: FilterArah;
  alasan: FilterAlasan;
  dari?: Date;
  sampai?: Date;
  /** Sebagian nama bahan (B108). */
  cari?: string;
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
    ...queryCari(kriteria.cari ?? ""),
    page: String(halaman),
    limit: String(ukuran),
  };
}