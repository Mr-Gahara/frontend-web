/**
 * Pemanggilan API bahan baku.
 *
 * Lapisan ini memisahkan detail HTTP dari komponen: path diambil dari
 * konstanta endpoint, respons sudah ternormalisasi (_id menjadi id) oleh
 * lib/api/normalize.ts, dan kegagalan dilempar sebagai ApiError bertipe.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { BahanBaku, BahanBakuRequest } from "@/types/bahanBaku";

export const bahanBakuApi = {
  daftar: () => apiData.get<BahanBaku[]>(EP.bahanBaku.list),
  detail: (id: string) => apiData.get<BahanBaku>(EP.bahanBaku.detail(id)),
  buat: (payload: BahanBakuRequest) => apiData.post<BahanBaku>(EP.bahanBaku.list, payload),
  perbarui: (id: string, payload: BahanBakuRequest) =>
    apiData.put<BahanBaku>(EP.bahanBaku.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.bahanBaku.detail(id)),
};
