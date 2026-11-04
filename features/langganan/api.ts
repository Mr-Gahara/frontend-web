/**
 * Langganan toko (B229): token pengguna dengan izin read-langganan. Akun
 * diambil backend dari toko di sesi, jadi tanpa id. Riwayat berkursor
 * seperti riwayat admin: cursorBerikutnya dan total di tingkat atas.
 */
import { apiData, apiMentah } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { normalizeId } from "@/lib/api/normalize";
import type { HalamanRiwayatToko, LanggananToko, RiwayatLanggananToko } from "@/types/langganan";

interface ResponsRiwayat {
  data?: RiwayatLanggananToko[];
  cursorBerikutnya?: string | null;
  total?: number;
}

export const langgananApi = {
  toko: () => apiData.get<LanggananToko>(EP.akun.langganan),
  riwayat: async (cursor?: string): Promise<HalamanRiwayatToko> => {
    const mentah = await apiMentah.get<ResponsRiwayat>(EP.akun.langgananRiwayat, cursor ? { cursor } : undefined);
    return {
      data: normalizeId(mentah.data ?? []),
      cursorBerikutnya: mentah.cursorBerikutnya ?? null,
      total: mentah.total ?? 0,
    };
  },
};
