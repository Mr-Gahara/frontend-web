import { lingkupOutlet, type CakupanLokasiOutlet } from "@/features/inventaris/cakupan";
import { keTanggalLokal } from "@/lib/waktu";
import type { AlasanJurnal, TipeKoreksi } from "@/types/jurnalStok";

export type FilterArah = TipeKoreksi | "ALL";
export type FilterAlasan = AlasanJurnal | "ALL";

/**
 * Lokasi jurnal ruang outlet. GET /jurnalstok hanya menyaring satu
 * locationID, sehingga pilihan Semua Outlet memakai satu-satunya outlet
 * tenant (MVP). Bila outlet lebih dari satu, halaman meminta pengguna memilih
 * satu outlet sampai backend punya filter tipe lokasi. null berarti cakupan
 * belum siap, gagal, atau lokasi aktif kosong.
 */
export type LokasiJurnalOutlet = { lokasiID: string } | { pilihSatuOutlet: true } | null;

export function lokasiJurnalOutlet(cakupan: CakupanLokasiOutlet, pilihan: string): LokasiJurnalOutlet {
  const lingkup = lingkupOutlet(cakupan, pilihan);
  if (!lingkup) return null;
  if (lingkup.locationID) return { lokasiID: lingkup.locationID };
  if (cakupan.status !== "lintas") return null;
  return cakupan.lokasiOutlet.length === 1
    ? { lokasiID: cakupan.lokasiOutlet[0].id }
    : { pilihSatuOutlet: true };
}

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