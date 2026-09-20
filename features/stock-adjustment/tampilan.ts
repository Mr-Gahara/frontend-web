import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { StockAdjustmentItem } from "@/types/stockOpname";

/**
 * Penanganan sementara bug mapper backend (mappers/stockOpnameMapper.js).
 * Mapper membaca qtySebelum, qtyAdjustment, stockOpnameID, dan catatan,
 * sedangkan model StockAdjustment menyimpan qtyCurrent, qtyDifference,
 * referenceID, dan alasan. Akibatnya keempat nilai selalu dikirim 0 atau
 * null, dan referenceType tidak dikirim sama sekali. Selama bernilai false,
 * halaman menampilkan "-" alih-alih angka yang pasti salah. Ubah menjadi
 * true, atau hapus penanganan ini, setelah mapper backend diperbaiki.
 */
export const MAPPER_ADJUSTMENT_SUDAH_BENAR = false;

export type ArahKoreksi = "tambah" | "kurang" | "tetap";

export interface BarisItemAdjustment {
  itemId: string;
  nama: string;
  satuan: string;
  qtySistem: number | null;
  qtyFisik: number;
  qtyKoreksi: number | null;
  arah: ArahKoreksi | null;
  catatan: string;
}

export function formatTanggalAdjustment(iso: string | null | undefined): string {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
}

export function formatKoreksi(qty: number | null): string {
  if (qty === null) return "-";
  return qty > 0 ? `+${qty}` : String(qty);
}

export function susunBarisItem(
  item: StockAdjustmentItem,
  mapperBenar = MAPPER_ADJUSTMENT_SUDAH_BENAR,
): BarisItemAdjustment {
  const qtyKoreksi = mapperBenar ? item.qtyAdjustment : null;
  let arah: ArahKoreksi | null = null;
  if (qtyKoreksi !== null) {
    arah = qtyKoreksi > 0 ? "tambah" : qtyKoreksi < 0 ? "kurang" : "tetap";
  }

  return {
    itemId: item.itemId,
    nama: item.namaSnapshot ?? "-",
    satuan: item.satuanSnapshot ?? "-",
    qtySistem: mapperBenar ? item.qtySebelum : null,
    qtyFisik: item.qtyPhysical,
    qtyKoreksi,
    arah,
    catatan: item.catatanItem ?? "-",
  };
}