import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { StatusTransfer, TransferStok } from "@/types/transferStok";
import type { ItemPayloadTerima } from "./payload";

export interface FilterTransferStok {
  status?: StatusTransfer;
  /**
   * Diusulkan dicocokkan dengan lokasi asal atau tujuan, seperti pengajuan
   * stok. Hari ini diabaikan backend bersama seluruh query (kontrak/temuan.md
   * butir 33); penyaringan klien ada di filter.ts.
   */
  locationID?: string;
}

/** PUT hanya mengirim items; backend tidak memeriksa jumlah maupun stok (kontrak/temuan.md butir 32). */
export interface PayloadRevisi {
  items: { bahanBakuID: string; qtyKirim: number }[];
}

export interface TransferDariPengajuan {
  pengajuanStokID: string;
  tanggalKirim: string;
}

/**
 * Bentuk minimal respons pembuatan surat jalan yang dipakai halaman.
 * Tipe transfer lengkap menyusul saat submodul 6 dimigrasikan.
 */
export interface TransferDibuat {
  id: string;
}

export const transferStokApi = {
  /** Backend menyalin item dan arah lokasi dari pengajuan (transferStokService baris 143 dan 144). */
  buatDariPengajuan: (payload: TransferDariPengajuan) =>
    apiData.post<TransferDibuat>(EP.transferStok.list, payload),
  daftar: (filter: FilterTransferStok) => {
    const params: Record<string, string> = {};
    if (filter.status) params.status = filter.status;
    if (filter.locationID) params.locationID = filter.locationID;
    return apiData.get<TransferStok[]>(EP.transferStok.list, params);
  },
  detail: (id: string) => apiData.get<TransferStok>(EP.transferStok.detail(id)),
  revisi: (id: string, payload: PayloadRevisi) => apiData.put<TransferStok>(EP.transferStok.detail(id), payload),
  /** Hanya dari PENDING; stok gudang dipotong dan jurnal Keluar dicatat. */
  kirim: (id: string) => apiData.patch<TransferStok>(EP.transferStok.kirim(id), {}),
  /** Items menggantikan seluruh items surat jalan (kontrak/temuan.md butir 29); susun lewat susunPayloadTerima. */
  terima: (id: string, payload: { items: ItemPayloadTerima[] }) =>
    apiData.patch<TransferStok>(EP.transferStok.terima(id), payload),
  batal: (id: string) => apiData.patch<TransferStok>(EP.transferStok.batal(id), {}),
};