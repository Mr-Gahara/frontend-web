/**
 * Pemanggilan API pola roster.
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts, dan kegagalan
 * dilempar sebagai ApiError. DELETE /polaroster/:id menghapus permanen
 * (keputusan Fase 0).
 */
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { PolaRosterItem, PolaRosterRequest } from "@/types/pola-roster";

export const polaRosterApi = {
  daftar: (filter: Record<string, string>) =>
    apiData.get<PolaRosterItem[]>(`${EP.polaRoster.list}?${new URLSearchParams(filter)}`),
  buat: (payload: PolaRosterRequest) =>
    apiData.post<PolaRosterItem>(EP.polaRoster.list, payload),
  perbarui: (id: string, payload: PolaRosterRequest) =>
    apiData.put<PolaRosterItem>(EP.polaRoster.detail(id), payload),
  hapus: (id: string) => apiData.delete<PolaRosterItem>(EP.polaRoster.detail(id)),
};