/**
 * Pemanggilan API master shift.
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts (id, bukan _id),
 * dan kegagalan dilempar sebagai ApiError. DELETE /shift/:id hanya
 * menonaktifkan shift (status Non-Aktif), bukan menghapusnya.
 */
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { ShiftItem, ShiftRequest } from "@/types/shift";

export const shiftApi = {
  daftar: (filter: Record<string, string>) =>
    apiData.get<ShiftItem[]>(`${EP.shift.list}?${new URLSearchParams(filter)}`),
  buat: (payload: ShiftRequest) => apiData.post<ShiftItem>(EP.shift.list, payload),
  perbarui: (id: string, payload: ShiftRequest) =>
    apiData.put<ShiftItem>(EP.shift.detail(id), payload),
  nonaktifkan: (id: string) => apiData.delete<ShiftItem>(EP.shift.detail(id)),
};