// types/pengajuanStok.ts

export type StatusPengajuan = "DRAFT" | "SUBMITTED" | "APPROVED" | "PENDING" | "REJECTED" | "COMPLETED";
export type JenisPengajuan = "PERMINTAAN" | "PENGIRIMAN";

export interface LokasiRelasi {
  id: string;
  nama: string | null;
  tipe: string | null;
}

export interface PenggunaRelasi {
  id: string;
  nama: string | null;
}

export interface PengajuanItem {
  bahanBaku: {
    id: string;
    namaBahan: string | null;
    satuan: string | null;
  } | null;
  /** Dalam satuan dasar bahan sejak AR42 (B364). */
  jumlah: number;
  satuan: string | null;
  /** Masukan pengaju sebelum dikonversi, misalnya 2 kaleng; null sebelum AR42. */
  satuanMasukan?: string | null;
  jumlahMasukan?: number | null;
  stokGudangSaatIni?: number;
}

export interface PengajuanStok {
  id: string;
  tenantID: string | null;
  nomorPengajuan: string;
  jenisPengajuan: JenisPengajuan;
  status: StatusPengajuan;
  
  dariLokasi: LokasiRelasi | null;
  keLokasi: LokasiRelasi | null;
  
  /** Pengaju beserta lokasi kerjanya (id atau null; B338). */
  dimintaOleh: (PenggunaRelasi & { locationID?: string | null }) | null;
  disetujuiOleh: PenggunaRelasi | null;
  ditolakOleh: PenggunaRelasi | null;
  
  items: PengajuanItem[];
  
  catatan: string | null;
  catatanPenolakan: string | null;
  tanggalKebutuhan: string | null;
  tanggalApprove: string | null;
  tanggalReject: string | null;
  
  transferStokID: string | null;
  createdAt: string;
  updatedAt: string;
}