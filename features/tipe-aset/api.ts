/**
 * Pemanggilan API tipe aset.
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts (id, bukan _id),
 * dan kegagalan dilempar sebagai ApiError.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { TipeAset, TipeAsetPayload } from "@/types/tipeAset";

export const tipeAsetApi = {
  daftar: () => apiData.get<TipeAset[]>(EP.tipeAset.list),
  detail: (id: string) => apiData.get<TipeAset>(EP.tipeAset.detail(id)),
  buat: (payload: TipeAsetPayload) => apiData.post<TipeAset>(EP.tipeAset.list, payload),
  perbarui: (id: string, payload: TipeAsetPayload) =>
    apiData.put<TipeAset>(EP.tipeAset.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.tipeAset.detail(id)),
};