/**
 * Ruang tempat daftar dan detail stock adjustment ditampilkan. Ruang outlet
 * hanya menampilkan adjustment lokasi Outlet, ruang gudang hanya lokasi
 * Gudang: stok outlet dan gudang tidak dicampur (keputusan pemilik proyek,
 * 22 September 2026).
 */
export type RuangAdjustment = "outlet" | "gudang";

export const URL_DAFTAR_ADJUSTMENT: Record<RuangAdjustment, string> = {
  outlet: "/dashboard/outlet/inventaris/stockAdjustment",
  gudang: "/dashboard/gudang/stockAdjustment",
};

/** Tipe lokasi yang adjustment-nya ditampilkan di tiap ruang. */
export const TIPE_LOKASI_RUANG: Record<RuangAdjustment, string> = {
  outlet: "Outlet",
  gudang: "Gudang",
};