import { api, apiData } from "@/lib/api/client";
import type { Paginasi } from "@/lib/api/normalize";
import { EP } from "@/lib/api/endpoints";
import type { AkunKas, AkunKasRequest, MutasiKas, RingkasanMutasi } from "@/types/akunKas";

export type HalamanMutasi = { data: MutasiKas[]; pagination: Paginasi | null };

/**
 * Field yang diterima PUT /akunkas/:id (FIELD_UPDATE validator backend).
 * saldo ditolak 400; keterangan null berarti dikosongkan.
 */
export type PayloadUbahAkunKas = Partial<
  Pick<AkunKas, "namaAkun" | "nomorAkun" | "tipeAkun" | "status" | "keterangan">
>;

export const akunKasApi = {
  daftar: () => apiData.get<AkunKas[]>(EP.akunKas),
  buat: (payload: AkunKasRequest) => apiData.post<AkunKas>(EP.akunKas, payload),
  ubah: (id: string, payload: PayloadUbahAkunKas) =>
    apiData.put<AkunKas>(EP.akunKasById(id), payload),
  /** Buku mutasi gabungan, selalu per halaman; pagination diteruskan apa adanya. */
  mutasi: async (params: Record<string, string>): Promise<HalamanMutasi> => {
    const hasil = await api.get<MutasiKas[]>(EP.akunKasMutasi, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  /** Ringkasan satu periode untuk satu akun kas. */
  ringkasan: (id: string, periode: Record<string, string>) =>
    apiData.get<RingkasanMutasi>(EP.akunKasRingkasan(id), periode),
  /** Ringkasan satu periode gabungan seluruh akun kas (backend nizar c29310c, butir 125). */
  ringkasanGabungan: (periode: Record<string, string>) =>
    apiData.get<RingkasanMutasi>(EP.akunKasRingkasanGabungan, periode),
};