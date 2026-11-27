"use client";

import { useStokProdukLonceng } from "./hooks";
import { KartuPemberitahuan } from "./kartu-pemberitahuan";

/**
 * Pesan pemicu stok LN1a di dalam halaman (LN3a): banner dashboard outlet,
 * Buat Penjualan, pajak per produk, dan diskon per produk. Isinya sama
 * dengan kartu lonceng (LN15a); halaman tetap dapat dipakai. Tidak tampil
 * selama ringkasan dashboard outlet belum termuat atau pemicunya tidak
 * berlaku (PW07).
 */
export function PesanStokProduk({ className }: { className?: string }) {
  const { pemberitahuan } = useStokProdukLonceng();
  if (!pemberitahuan) return null;
  return (
    <div role="status" className={className}>
      <KartuPemberitahuan pemberitahuan={pemberitahuan} className="border border-rose-200 sm:px-5" />
    </div>
  );
}
