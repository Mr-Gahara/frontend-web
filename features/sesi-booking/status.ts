import type { SesiBookingResponse, StatusBooking } from "@/types/sesiBooking";
import { bookingBentrok } from "./tampilan";

/**
 * Booking Aktif yang belum dibayar di aset itu dan bertumpuk dengan rentang
 * [mulai, selesai), atau null. Sejak backend 465b438 booking belum dibayar
 * tidak mengunci jadwal, sehingga form hanya memperingatkan tanpa menghalangi
 * (keputusan R10). Aturan tumpukan, termasuk booking tanpa waktuSelesai yang
 * dianggap satu jam, dipakai bersama bookingBentrok.
 */
export function bookingBertumpukBelumDibayar(
  daftar: SesiBookingResponse[],
  asetId: string,
  mulai: Date,
  selesai: Date,
): SesiBookingResponse | null {
  const belumDibayar = daftar.filter((b) => b.status === "Aktif" && !b.sudahDibayar);
  const kena = bookingBentrok(
    belumDibayar.map((b) => ({ ...b, sudahDibayar: true })),
    asetId,
    mulai,
    selesai,
  );
  return kena ? (belumDibayar.find((b) => b.id === kena.id) ?? null) : null;
}

/** Label status di blok timeline: Selesai diberi keterangan, Aktif tanpa label (keputusan R9). */
export function labelStatusBooking(status: StatusBooking): string {
  if (status === "Selesai") return " · Selesai";
  return "";
}