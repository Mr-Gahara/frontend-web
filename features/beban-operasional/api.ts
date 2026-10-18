import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type {
  BebanOperasional,
  PayloadBatalBeban,
  PayloadBuatBeban,
  PayloadUbahBeban,
} from "@/types/bebanOperasional";

export type HalamanBeban = { data: BebanOperasional[]; pagination: Paginasi | null };

export const bebanApi = {
  /** Satu halaman daftar beban; pagination diteruskan apa adanya. */
  daftar: async (params: Record<string, string>): Promise<HalamanBeban> => {
    const hasil = await api.get<BebanOperasional[]>(EP.bebanOperasional.list, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  buat: (payload: PayloadBuatBeban) =>
    apiData.post<BebanOperasional>(EP.bebanOperasional.list, payload),
  ubah: (id: string, payload: PayloadUbahBeban) =>
    apiData.put<BebanOperasional>(EP.bebanOperasional.detail(id), payload),
  /** Tidak ada DELETE: beban dibatalkan lewat PUT berstatus VOID (P21 backend). */
  batalkan: (id: string, payload: PayloadBatalBeban) =>
    apiData.put<BebanOperasional>(EP.bebanOperasional.detail(id), payload),
};