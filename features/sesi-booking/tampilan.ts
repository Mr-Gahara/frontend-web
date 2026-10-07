import type { SesiBookingResponse } from "@/types/sesiBooking";

/**
 * Mengelompokkan booking per aset untuk timeline, hanya booking yang
 * bertumpuk dengan jendela [awal, akhir). Booking VOID tidak ditampilkan
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
    if (booking.status === "VOID") continue;
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
 * melihat, membayar, dan membatalkan tagihannya: sejak backend 465b438
 * penjualan booking tersimpan UNPAID, dan void penjualan tanpa pembayaran
 * membatalkan seluruh booking di dalamnya. Null bila booking tidak membawa
 * penjualan.
 */
export function tautanPenjualanBooking(booking: SesiBookingResponse): string | null {
  const id = booking.dataPenjualan?.id;
  return id ? `/dashboard/outlet/penjualan/${id}` : null;
}

/**
 * Booking yang menempati aset itu dan bertumpuk dengan rentang [mulai,
 * selesai), atau null. Hanya booking Aktif yang sudah dibayar yang dihitung,
 * sejalan dengan checkConflict backend 465b438: booking yang belum dibayar
 * tidak mengunci jadwal, dan Selesai serta VOID tidak menempati.
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
    if (booking.dataAset?.id !== asetId || booking.status !== "Aktif" || !booking.sudahDibayar) continue;
    const awal = new Date(booking.waktuMulai);
    const akhir = booking.waktuSelesai ? new Date(booking.waktuSelesai) : new Date(awal.getTime() + 3_600_000);
    if (mulai < akhir && selesai > awal) return booking;
  }
  return null;
}