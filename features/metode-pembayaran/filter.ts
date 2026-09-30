import type { MetodePembayaran } from "@/types/metodePembayaran";

/** Metode yang dapat dipilih; aturan halaman pembayaran lama dipertahankan (isActive !== false). */
export function metodeAktif(daftar: MetodePembayaran[]): MetodePembayaran[] {
  return daftar.filter((m) => m.isActive !== false);
}
