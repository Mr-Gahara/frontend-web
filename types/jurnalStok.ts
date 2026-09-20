export type TipeKoreksi = "Masuk" | "Keluar";
export type AlasanJurnal = "Stok Opname" | "Rusak/Hilang" | "Transfer Gudang" | "Lainnya";

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
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}
