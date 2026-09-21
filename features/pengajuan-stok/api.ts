import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { PengajuanStok, StatusPengajuan } from "@/types/pengajuanStok";
import type { PayloadPengajuan } from "./payload";

export interface FilterPengajuanStok {
  status?: StatusPengajuan;
  /** Backend mencocokkan lokasi asal atau tujuan (pengajuanStokService.getAll). */
  locationID?: string;
}

export const pengajuanStokApi = {
  daftar: (filter: FilterPengajuanStok) => {
    const params: Record<string, string> = {};
    if (filter.status) params.status = filter.status;
    if (filter.locationID) params.locationID = filter.locationID;
    return apiData.get<PengajuanStok[]>(EP.pengajuanStok.list, params);
  },
  detail: (id: string) => apiData.get<PengajuanStok>(EP.pengajuanStok.detail(id)),
  /** Semua pengajuan dari web adalah permintaan outlet ke gudang. */
  buat: (payload: PayloadPengajuan) =>
    apiData.post<PengajuanStok>(EP.pengajuanStok.list, { jenisPengajuan: "PERMINTAAN", ...payload }),
  perbarui: (id: string, payload: PayloadPengajuan) =>
    apiData.put<PengajuanStok>(EP.pengajuanStok.detail(id), payload),
  ajukan: (id: string) => apiData.patch<PengajuanStok>(EP.pengajuanStok.submit(id), {}),
  /** Respons berisi dokumen sebelum diperbarui (kontrak/temuan.md butir 26); halaman tidak memakainya. */
  setujui: (id: string) => apiData.patch<unknown>(EP.pengajuanStok.approve(id), {}),
  tolak: (id: string, alasan: string) =>
    apiData.patch<PengajuanStok>(EP.pengajuanStok.reject(id), { alasan }),
};
