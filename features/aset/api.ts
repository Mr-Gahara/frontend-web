/**
 * Pemanggilan API aset.
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts, dan kegagalan
 * dilempar sebagai ApiError.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Aset, AsetPayload } from "@/types/aset";

export const asetApi = {
  daftar: () => apiData.get<Aset[]>(EP.aset.list),
  detail: (id: string) => apiData.get<Aset>(EP.aset.detail(id)),
  buat: (payload: AsetPayload) => apiData.post<Aset>(EP.aset.list, payload),
  perbarui: (id: string, payload: AsetPayload) => apiData.put<Aset>(EP.aset.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.aset.detail(id)),
};