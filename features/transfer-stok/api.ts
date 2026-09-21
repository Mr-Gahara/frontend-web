import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";

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
};