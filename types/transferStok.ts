export type StatusTransfer = "PENDING" | "DIKIRIM" | "DITERIMA" | "BATAL";

export interface TransferRelasiLokasi {
  id: string;
  nama: string | null;
  tipe: string | null;
}

export interface TransferRelasiPengguna {
  id: string;
  nama: string | null;
}

export interface TransferItem {
  bahanBaku: {
    id: string;
    namaBahan: string | null;
    satuan: string | null;
  } | null;
  qtyKirim: number;
  qtyTerima: number;
  selisih: number;
  catatanItem: string | null;
}

export interface TransferStok {
  id: string;
  tenantID: string | null;
  nomorTransfer: string;
  status: StatusTransfer;
  dariLokasi: TransferRelasiLokasi | null;
  keLokasi: TransferRelasiLokasi | null;
  pengirim: TransferRelasiPengguna | null;
  penerima: TransferRelasiPengguna | null;
  pengajuanStokID: string | null;
  items: TransferItem[];
  tanggalKirim: string | null;
  tanggalTerima: string | null;
  createdAt: string;
  updatedAt: string;
}