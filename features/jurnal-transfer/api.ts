import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type {
  JurnalTransfer,
  PayloadBatalTransfer,
  PayloadBuatTransfer,
} from "@/types/jurnalTransfer";

export type HalamanTransfer = { data: JurnalTransfer[]; pagination: Paginasi | null };

export const jurnalTransferApi = {
  /** Riwayat transfer per halaman; pagination diteruskan apa adanya. */
  daftar: async (params: Record<string, string>): Promise<HalamanTransfer> => {
    const hasil = await api.get<JurnalTransfer[]>(EP.jurnalTransfer, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  buat: (payload: PayloadBuatTransfer) =>
    apiData.post<JurnalTransfer>(EP.jurnalTransfer, payload),
  /** Tidak ada DELETE: transfer dibatalkan lewat PUT berstatus VOID. */
  batalkan: (id: string, payload: PayloadBatalTransfer) =>
    apiData.put<JurnalTransfer>(EP.jurnalTransferById(id), payload),
};