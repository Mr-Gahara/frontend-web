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
  /** Booking yang dimulai pada tanggal lokal YYYY-MM-DD. */
  daftar: (tanggal: string) =>
    apiData.get<SesiBookingResponse[]>(EP.sesiBooking.list, { tanggal }),
  /**
   * Booking yang tumpang tindih dengan tanggal lokal itu, termasuk yang mulai
   * kemarin dan masih berjalan lewat tengah malam (tampilan=timeline, B327).
   */
  timeline: (tanggal: string) =>
    apiData.get<SesiBookingResponse[]>(EP.sesiBooking.list, { tanggal, tampilan: "timeline" }),
  /** Buat booking lewat jalur batch; backend membuat penjualan booking tersimpan UNPAID (backend 465b438). */
  buat: (payload: SesiBookingBatchPayload) =>
    apiData.post<SesiBookingBatchResponse>(EP.sesiBooking.list, payload),
  /** Detail satu booking; dipakai detail penjualan untuk booking milik penjualan itu (NZ7a). */
  detail: (id: string) => apiData.get<SesiBookingResponse>(EP.sesiBooking.detail(id)),
  /** Menandai booking Selesai lebih awal; body hanya berisi status (backend nizar 60575b5). */
  tandaiSelesai: (id: string) =>
    apiData.put<SesiBookingResponse>(EP.sesiBooking.detail(id), { status: "Selesai" }),
};