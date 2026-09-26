import type { Pajak } from "@/types/pajak";

/**
 * Pajak per transaksi yang aktif, urut prioritas naik; aturan halaman buat
 * penjualan lama dipertahankan. Daftar asal tidak diubah.
 */
export function pajakTransaksiAktif(daftar: Pajak[]): Pajak[] {
  return daftar
    .filter((p) => p.statusPajak === true && p.tipePajak === false)
    .sort((a, b) => (a.prioritas || 0) - (b.prioritas || 0));
}