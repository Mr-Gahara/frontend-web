import { formatAngka } from "@/lib/format";
import type { RincianStok } from "@/types/inventory";

/**
 * Stok terbaca dari backend (P87, B362; pemilik proyek, 23 November 2026):
 * bahan berkemasan tampil sebagai rincian "1 pak 9 kaleng 25 ml" dengan
 * angka satuan dasar di bawahnya; bahan tanpa kemasan tetap satu baris.
 */

/** Rincian kemasan hanya bila backend mengirim satuan selain satuan dasar. */
export function rincianKemasan(stokTerbaca: readonly RincianStok[] | undefined, satuanDasar: string | null | undefined): string | null {
  if (!stokTerbaca || stokTerbaca.length === 0) return null;
  if (stokTerbaca.every((r) => r.satuan === satuanDasar)) return null;
  return stokTerbaca.map((r) => `${formatAngka(r.jumlah)} ${r.satuan}`).join(" ");
}

/** Angka stok dalam satuan dasar, misalnya "6.115 ml". */
export function teksStokDasar(stok: number, satuanDasar: string | null | undefined): string {
  return satuanDasar ? `${formatAngka(stok)} ${satuanDasar}` : formatAngka(stok);
}
