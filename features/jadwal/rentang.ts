import { keTanggalLokal } from "@/lib/waktu";

/**
 * Rentang GET /jadwalshift untuk satu bulan kalender, dalam tanggal lokal
 * (keputusan J1a). Kode lama memakai toISOString, sehingga di WIB awal
 * bulan bergeser ke hari terakhir bulan sebelumnya.
 */
export function rentangBulan(bulan: Date): { startDate: string; endDate: string } {
  const awal = new Date(bulan.getFullYear(), bulan.getMonth(), 1);
  const akhir = new Date(bulan.getFullYear(), bulan.getMonth() + 1, 0);
  return { startDate: keTanggalLokal(awal), endDate: keTanggalLokal(akhir) };
}

/** Mengurai YYYY-MM-DD sebagai tanggal lokal, bukan UTC seperti new Date(teks). */
export function uraiTanggalLokal(teks: string): Date {
  const [tahun, bulan, hari] = teks.split("-").map(Number);
  return new Date(tahun, bulan - 1, hari);
}

/** Tanggal YYYY-MM-DD dari dari sampai sampai, keduanya termasuk. */
export function daftarTanggal(dari: string, sampai: string): string[] {
  const hasil: string[] = [];
  const akhir = uraiTanggalLokal(sampai);
  for (let d = uraiTanggalLokal(dari); d <= akhir; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    hasil.push(keTanggalLokal(d));
  }
  return hasil;
}