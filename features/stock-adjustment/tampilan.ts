import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { StockAdjustment, StockAdjustmentItem, SumberAdjustment } from "@/types/stockOpname";

export type ArahKoreksi = "tambah" | "kurang" | "tetap";

export interface BarisItemAdjustment {
  itemId: string;
  nama: string;
  satuan: string;
  /** Stok sistem saat approval (qtyCurrent), dasar perhitungan koreksi. */
  qtySistem: number;
  /**
   * Stok saat draf opname dibuat, hanya bila berbeda dari qtySistem sebagai
   * tanda stok bergerak selama opname berlangsung. Null bila sama.
   */
  qtySaatDraf: number | null;
  qtyFisik: number;
  qtyKoreksi: number;
  arah: ArahKoreksi;
}

export interface SumberTampil {
  label: string;
  /** Tautan ke dokumen stock opname pemicu; null bila tidak ada. */
  href: string | null;
}

const LABEL_SUMBER: Record<SumberAdjustment, string> = {
  STOCK_OPNAME: "Stock Opname",
  MANUAL_CORRECTION: "Koreksi Manual",
};

export function formatTanggalAdjustment(iso: string | null | undefined): string {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
}

export function formatKoreksi(qty: number): string {
  return qty > 0 ? `+${qty}` : String(qty);
}

export function susunBarisItem(item: StockAdjustmentItem): BarisItemAdjustment {
  const qtyKoreksi = item.qtyDifference;
  return {
    itemId: item.itemId,
    nama: item.namaSnapshot ?? "-",
    satuan: item.satuanSnapshot ?? "-",
    qtySistem: item.qtyCurrent,
    qtySaatDraf: item.qtySnapshot === item.qtyCurrent ? null : item.qtySnapshot,
    qtyFisik: item.qtyPhysical,
    qtyKoreksi,
    arah: qtyKoreksi > 0 ? "tambah" : qtyKoreksi < 0 ? "kurang" : "tetap",
  };
}

/**
 * Sumber adjustment beserta tautannya. Bila dokumen opname pemicunya masih
 * ada, label memuat nomornya dan tautan membuka dokumen itu di ruang yang
 * sesuai tipe lokasi adjustment: ruang gudang untuk lokasi Gudang, ruang
 * outlet selain itu. Nilai sumber yang belum dikenal ditampilkan apa adanya.
 */
export function susunSumber(
  adjustment: Pick<StockAdjustment, "referenceType" | "referenceID" | "lokasi">,
): SumberTampil {
  const { referenceType, referenceID, lokasi } = adjustment;
  if (!referenceType) return { label: "-", href: null };
  const label = LABEL_SUMBER[referenceType] ?? referenceType;
  if (referenceType !== "STOCK_OPNAME" || !referenceID) return { label, href: null };
  const dasar =
    lokasi?.tipe === "Gudang"
      ? "/dashboard/gudang/stockOpname"
      : "/dashboard/outlet/inventaris/stockOpname";
  return {
    label: `${label} ${referenceID.nomorOpname}`,
    href: `${dasar}/${referenceID.id}`,
  };
}
