import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { PengajuanStok, StatusPengajuan } from "@/types/pengajuanStok";

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
};