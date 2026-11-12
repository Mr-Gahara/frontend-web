export type TipeKoreksi = "Masuk" | "Keluar";
/**
 * Alasan jurnal dari enum backend. "Pembelian" dari pembelian stok, dan
 * "Penjualan" dari penjualan sejak backend P78 (B319); jurnal penjualan lama
 * tetap "Lainnya".
 */
export type AlasanJurnal =
  | "Stok Opname"
  | "Rusak/Hilang"
  | "Transfer Gudang"
  | "Lainnya"
  | "Pembelian"
  | "Penjualan";

/**
 * Bentuk respons GET /jurnalstok setelah dinormalkan lib/api/client.ts.
 * bahanBakuID, dicatatOleh, dan locationID berisi objek hasil populate,
 * dan bernilai null bila data acuannya sudah dihapus.
 */
export interface JurnalStok {
  id: string;
  bahanBakuID: { id: string; namaBahan: string; satuan: string } | null;
  tanggal: string;
  tipeKoreksi: TipeKoreksi;
  jumlah: number;
  alasan: AlasanJurnal;
  keterangan?: string | null;
  dicatatOleh: { id: string; nama: string } | null;
  locationID: { id: string; nama: string; tipe: string } | null;
  /** Id penjualan pemotong stok (B319), tanpa populate; jurnal lain dan jurnal lama tanpa field ini. */
  penjualanID?: string | null;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}
