/**
 * Pemanggilan API sesi booking.
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts (id, bukan _id),
 * dan kegagalan dilempar sebagai ApiError.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type {
  SesiBookingBatchPayload,
  SesiBookingBatchResponse,
  SesiBookingResponse,
} from "@/types/sesiBooking";

export const sesiBookingApi = {
  /** Booking yang dimulai pada tanggal lokal YYYY-MM-DD; backend hanya membaca query tanggal. */
  daftar: (tanggal: string) =>
    apiData.get<SesiBookingResponse[]>(EP.sesiBooking.list, { tanggal }),
  /** Buat booking lewat jalur batch; backend membuat penjualan booking tersimpan UNPAID (backend 465b438). */
  buat: (payload: SesiBookingBatchPayload) =>
    apiData.post<SesiBookingBatchResponse>(EP.sesiBooking.list, payload),
};