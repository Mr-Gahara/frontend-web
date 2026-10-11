/**
 * Petak status venue di dashboard outlet (keputusan DB6a): status mengikuti
 * aset dari backend, dan rincian pelanggan serta sisa waktu diambil dari
 * booking hari ini yang sedang berjalan.
 */
import type { Aset, StatusAset } from "@/types/aset";
import type { SesiBookingResponse } from "@/types/sesiBooking";

export interface PetakVenue {
  id: string;
  nama: string;
  status: StatusAset;
  pelanggan: string | null;
  tipePelanggan: string | null;
  sisaMenit: number | null;
}

/** True bila booking Aktif dan jamnya mencakup saat ini. */
export function bookingBerjalan(booking: SesiBookingResponse, sekarang: Date): boolean {
  if (booking.status !== "Aktif" || !booking.waktuSelesai) return false;
  const saat = sekarang.getTime();
  return (
    new Date(booking.waktuMulai).getTime() <= saat &&
    saat < new Date(booking.waktuSelesai).getTime()
  );
}

/**
 * Satu petak per aset, diurutkan menurut nama secara numerik agar posisinya
 * tetap. Rincian hanya diisi untuk aset berstatus digunakan; bila ada dua
 * booking berjalan di aset yang sama, yang sudah dibayar didahulukan.
 */
export function petakVenue(
  aset: Pick<Aset, "id" | "namaAset" | "status">[],
  booking: SesiBookingResponse[],
  sekarang: Date,
): PetakVenue[] {
  const berjalan = new Map<string, SesiBookingResponse>();
  for (const b of booking) {
    const idAset = b.dataAset?.id;
    if (!idAset || !bookingBerjalan(b, sekarang)) continue;
    const terpilih = berjalan.get(idAset);
    if (!terpilih || (!terpilih.sudahDibayar && b.sudahDibayar)) berjalan.set(idAset, b);
  }
  return aset
    .map((a) => {
      const b = a.status === "digunakan" ? berjalan.get(a.id) : undefined;
      return {
        id: a.id,
        nama: a.namaAset,
        status: a.status,
        pelanggan: b?.dataPelanggan?.namaPelanggan ?? null,
        tipePelanggan: b?.dataPelanggan?.tipePelanggan ?? null,
        sisaMenit: b?.waktuSelesai
          ? Math.ceil((new Date(b.waktuSelesai).getTime() - sekarang.getTime()) / 60_000)
          : null,
      };
    })
    .sort((x, y) => x.nama.localeCompare(y.nama, "id", { numeric: true }));
}