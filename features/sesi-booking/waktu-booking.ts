import { addHours } from "date-fns";
import { gabungTanggalWaktu, waktuDari, type NilaiWaktu } from "@/lib/waktu";

/** Pilihan durasi sewa dalam jam, sama dengan halaman lama. */
export const DURASI_PILIHAN = [1, 2, 3, 4, 5, 6, 8] as const;

/** Tanggal, jam mulai, dan durasi satu fasilitas di form buat reservasi. */
export interface WaktuItem {
  tanggal: Date;
  waktu: NilaiWaktu;
  durasi: number;
}

/** Waktu awal satu fasilitas: tanggal dan jam saat ini, durasi 1 jam. */
export function waktuItemDari(sekarang: Date): WaktuItem {
  return { tanggal: sekarang, waktu: waktuDari(sekarang), durasi: 1 };
}

/** Rentang mulai dan selesai; null bila jam mulai belum lengkap. */
export function rentangWaktuItem(item: WaktuItem): { mulai: Date; selesai: Date } | null {
  const mulai = gabungTanggalWaktu(item.tanggal, item.waktu);
  return mulai ? { mulai, selesai: addHours(mulai, item.durasi) } : null;
}

/**
 * Nilai waktuMulai dan waktuSelesai untuk form. Jam yang belum lengkap
 * menghasilkan isian kosong, yang lalu ditolak skema (keputusan K-TW5a).
 */
export function isianWaktuItem(item: WaktuItem): { waktuMulai: string; waktuSelesai: string } {
  const rentang = rentangWaktuItem(item);
  if (!rentang) return { waktuMulai: "", waktuSelesai: "" };
  return { waktuMulai: rentang.mulai.toISOString(), waktuSelesai: rentang.selesai.toISOString() };
}