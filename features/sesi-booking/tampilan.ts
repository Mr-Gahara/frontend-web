import type { SesiBookingResponse } from "@/types/sesiBooking";

/**
 * Mengelompokkan booking per aset untuk timeline, hanya booking yang
 * bertumpuk dengan jendela [awal, akhir). Booking Batal tidak ditampilkan
 * (keputusan R5a): slotnya sudah dilepas, dan menampilkannya membuat aset
 * tampak terpakai. Backend tetap mengirimnya karena daftar tidak disaring
 * menurut status. Booking tanpa waktuSelesai dianggap berlangsung sampai
 * akhir jendela, sama seperti sebelum migrasi.
 */
export function bookingPerAset(
  daftar: SesiBookingResponse[],
  awal: Date,
  akhir: Date,
): Map<string, SesiBookingResponse[]> {
  const peta = new Map<string, SesiBookingResponse[]>();
  for (const booking of daftar) {
    if (booking.status === "Batal") continue;
    const asetId = booking.dataAset?.id;
    if (!asetId) continue;
    const mulai = new Date(booking.waktuMulai);
    const selesai = booking.waktuSelesai ? new Date(booking.waktuSelesai) : akhir;
    if (selesai <= awal || mulai >= akhir) continue;
    const isi = peta.get(asetId) ?? [];
    isi.push(booking);
    peta.set(asetId, isi);
  }
  return peta;
}

/**
 * Tautan detail penjualan sebuah booking (keputusan R4b), sebagai jalur untuk
 * melihat dan membayar tagihannya. Web belum punya jalur membatalkan booking:
 * penjualan booking selalu FINAL, dan detail penjualan hanya menawarkan void
 * untuk DRAFT. Null bila booking tidak membawa penjualan.
 */
export function tautanPenjualanBooking(booking: SesiBookingResponse): string | null {
  const id = booking.dataPenjualan?.id;
  return id ? `/dashboard/outlet/penjualan/${id}` : null;
}

/**
 * Booking Aktif di aset itu yang bertumpuk dengan rentang [mulai, selesai),
 * atau null. Hanya booking Aktif yang dihitung (keputusan R6a), sejalan
 * dengan checkConflict backend; sebelumnya booking Selesai ikut dihitung.
 * Booking tanpa waktuSelesai dianggap berlangsung satu jam, sama dengan
 * halaman lama.
 */
export function bookingBentrok(
  daftar: SesiBookingResponse[],
  asetId: string,
  mulai: Date,
  selesai: Date,
): SesiBookingResponse | null {
  if (!asetId) return null;
  for (const booking of daftar) {
    if (booking.dataAset?.id !== asetId || booking.status !== "Aktif") continue;
    const awal = new Date(booking.waktuMulai);
    const akhir = booking.waktuSelesai ? new Date(booking.waktuSelesai) : new Date(awal.getTime() + 3_600_000);
    if (mulai < akhir && selesai > awal) return booking;
  }
  return null;
}