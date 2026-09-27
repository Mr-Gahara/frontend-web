/**
 * Pemanggilan API tarif.
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts (id, bukan _id),
 * dan kegagalan dilempar sebagai ApiError.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Tarif, TarifPayload } from "@/types/tarif";

export const tarifApi = {
  daftar: () => apiData.get<Tarif[]>(EP.tarif.list),
  detail: (id: string) => apiData.get<Tarif>(EP.tarif.detail(id)),
  buat: (payload: TarifPayload) => apiData.post<Tarif>(EP.tarif.list, payload),
  perbarui: (id: string, payload: TarifPayload) =>
    apiData.put<Tarif>(EP.tarif.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.tarif.detail(id)),
};