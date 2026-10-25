import { TIPE_LOKASI_RUANG } from "@/features/stock-adjustment/ruang";
import type { RuangPembelian } from "./izin";

/** Daftar pembelian stok per ruang. */
export const URL_PEMBELIAN: Record<RuangPembelian, string> = {
  outlet: "/dashboard/outlet/inventaris/pembelianStok",
  gudang: "/dashboard/gudang/pembelianStok",
};

export function urlDetailPembelian(ruang: RuangPembelian, id: string): string {
  return `${URL_PEMBELIAN[ruang]}/${id}`;
}

/**
 * Tipe lokasi penerima yang pembeliannya ditampilkan di tiap ruang. Stok
 * outlet dan gudang tidak dicampur di tampilan mana pun (Model bisnis MVP),
 * sama dengan stock adjustment dan stock opname.
 */
export const TIPE_LOKASI_PEMBELIAN: Record<RuangPembelian, string> = TIPE_LOKASI_RUANG;