import type { Pembayaran } from "@/types/pembayaran";

/** Pembayaran milik satu penjualan, dengan urutan dari backend dipertahankan. */
export function pembayaranPenjualan(daftar: Pembayaran[], penjualanId: string): Pembayaran[] {
  return daftar.filter((p) => p.penjualanID === penjualanId);
}