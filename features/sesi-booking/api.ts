/**
 * Pemanggilan API sesi booking.
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts (id, bukan _id),
 * dan kegagalan dilempar sebagai ApiError.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { SesiBookingResponse } from "@/types/sesiBooking";

export const sesiBookingApi = {
  /** Booking yang dimulai pada tanggal lokal YYYY-MM-DD; backend hanya membaca query tanggal. */
  daftar: (tanggal: string) =>
    apiData.get<SesiBookingResponse[]>(EP.sesiBooking.list, { tanggal }),
};