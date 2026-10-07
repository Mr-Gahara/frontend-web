import { IZIN } from "@/lib/auth/permissions";
import type { SesiBookingResponse } from "@/types/sesiBooking";

/** Izin sesi booking sesuai route backend (keputusan rancangan butir 14). */
export const IZIN_BOOKING = {
  baca: IZIN.booking,
  ubah: IZIN.ubahBooking,
} as const;

export const bolehBacaBooking = (permissions: readonly string[]) => permissions.includes(IZIN_BOOKING.baca);

/**
 * Booking boleh ditandai Selesai lebih awal (keputusan NZ7a): hanya booking
 * Aktif yang sudah dibayar dan jamnya belum lewat, bagi pemegang
 * update-booking. Backend nizar 60575b5 menolak booking yang status
 * efektifnya bukan Aktif, dan booking yang jamnya lewat dianggap Selesai.
 */
export function bolehTandaiSelesai(
  booking: Pick<SesiBookingResponse, "status" | "sudahDibayar" | "waktuSelesai">,
  permissions: readonly string[],
  sekarang: Date = new Date(),
): boolean {
  if (booking.status !== "Aktif" || !booking.sudahDibayar) return false;
  if (booking.waktuSelesai && new Date(booking.waktuSelesai) <= sekarang) return false;
  return permissions.includes(IZIN_BOOKING.ubah);
}