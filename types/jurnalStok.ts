export type TipeKoreksi = "Masuk" | "Keluar";
export type AlasanJurnal = "Stok Opname" | "Rusak/Hilang" | "Transfer Gudang" | "Lainnya";

export interface JurnalStok {
  _id?: string;
  id?: string;
  bahanBakuID: {
    _id: string;
    id?: string;
    namaBahan: string;
    satuan: string;
  };
  tanggal: string; // ISO Date string
  tipeKoreksi: TipeKoreksi;
  jumlah: number;
  alasan: AlasanJurnal;
  keterangan?: string | null;
  dicatatOleh: {
    _id: string;
    id?: string;
    nama: string;
  };
  locationID: {
    _id: string;
    id?: string;
    nama: string;
    tipe: string;
  };
  tenantID: string;
  createdAt?: string;
  updatedAt?: string;
}
