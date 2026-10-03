import { api, apiData } from "@/lib/api/client";
import type { Paginasi } from "@/lib/api/normalize";
import { EP } from "@/lib/api/endpoints";
import type { AkunKas, AkunKasRequest, MutasiKas, RingkasanMutasi } from "@/types/akunKas";

export type HalamanMutasi = { data: MutasiKas[]; pagination: Paginasi | null };

export const akunKasApi = {
  daftar: () => apiData.get<AkunKas[]>(EP.akunKas),
  buat: (payload: AkunKasRequest) => apiData.post<AkunKas>(EP.akunKas, payload),
  /** Buku mutasi gabungan, selalu per halaman; pagination diteruskan apa adanya. */
  mutasi: async (params: Record<string, string>): Promise<HalamanMutasi> => {
    const hasil = await api.get<MutasiKas[]>(EP.akunKasMutasi, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  /** Ringkasan satu periode; backend hanya menyediakannya per akun kas. */
  ringkasan: (id: string, periode: Record<string, string>) =>
    apiData.get<RingkasanMutasi>(EP.akunKasRingkasan(id), periode),
};