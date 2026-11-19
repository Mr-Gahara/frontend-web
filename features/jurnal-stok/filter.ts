import { labelPilPeriode, rentangSama, type PilFilter } from "@/lib/filter";
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
/** Isian panel filter jurnal (FL1a); nama bahan kotak cari di bilah. */
export interface FilterPanelJurnal {
  arah: FilterArah;
  alasan: FilterAlasan;
  dari: Date;
  sampai: Date;
}

export const LABEL_ARAH_JURNAL: Record<Exclude<FilterArah, "ALL">, string> = {
  Masuk: "Barang Masuk",
  Keluar: "Barang Keluar",
};

/** Urutan dan label alasan; label transfer berbeda per ruang. */
export function opsiAlasanJurnal(labelTransfer: string): { nilai: Exclude<FilterAlasan, "ALL">; label: string }[] {
  return [
    { nilai: "Transfer Gudang", label: labelTransfer },
    { nilai: "Stok Opname", label: "Stok Opname" },
    { nilai: "Rusak/Hilang", label: "Rusak / Hilang" },
    { nilai: "Pembelian", label: "Pembelian" },
    { nilai: "Penjualan", label: "Penjualan" },
    { nilai: "Lainnya", label: "Lainnya" },
  ];
}

const periodeJurnalDiubah = (f: FilterPanelJurnal, bawaan: FilterPanelJurnal) =>
  !rentangSama({ dari: f.dari, sampai: f.sampai }, { dari: bawaan.dari, sampai: bawaan.sampai });

/** Jumlah filter aktif; periode bawaan bulan ini tidak dihitung (FL11a). */
export function jumlahFilterJurnal(f: FilterPanelJurnal, bawaan: FilterPanelJurnal): number {
  return (f.arah !== "ALL" ? 1 : 0) + (f.alasan !== "ALL" ? 1 : 0) + (periodeJurnalDiubah(f, bawaan) ? 1 : 0);
}

export function pilFilterJurnal(
  f: FilterPanelJurnal,
  bawaan: FilterPanelJurnal,
  labelTransfer: string,
  hariIni: Date,
  terapkan: (baru: FilterPanelJurnal) => void,
): PilFilter[] {
  const pil: PilFilter[] = [];
  if (f.arah !== "ALL") {
    pil.push({ kunci: "arah", label: `Arah: ${LABEL_ARAH_JURNAL[f.arah]}`, onHapus: () => terapkan({ ...f, arah: "ALL" }) });
  }
  if (f.alasan !== "ALL") {
    const label = opsiAlasanJurnal(labelTransfer).find((o) => o.nilai === f.alasan)?.label ?? f.alasan;
    pil.push({ kunci: "alasan", label: `Alasan: ${label}`, onHapus: () => terapkan({ ...f, alasan: "ALL" }) });
  }
  if (periodeJurnalDiubah(f, bawaan)) {
    const label = labelPilPeriode({ dari: f.dari, sampai: f.sampai }, hariIni) ?? "";
    pil.push({ kunci: "periode", label, onHapus: () => terapkan({ ...f, dari: bawaan.dari, sampai: bawaan.sampai }) });
  }
  return pil;
}
