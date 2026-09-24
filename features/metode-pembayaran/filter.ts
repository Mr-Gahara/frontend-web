import type { MetodePembayaran } from "@/types/metodePembayaran";

/**
 * Nama metode untuk id itu (keputusan K12). "-" bila daftar belum ada atau
 * gagal dimuat, id kosong, atau metodenya sudah terhapus; tidak pernah nama
 * pengganti yang tampak benar.
 */
export function namaMetode(daftar: MetodePembayaran[] | undefined, id: string | null): string {
  if (!daftar || !id) return "-";
  return daftar.find((m) => m.id === id)?.namaPembayaran ?? "-";
}