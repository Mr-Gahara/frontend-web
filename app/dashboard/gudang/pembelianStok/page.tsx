"use client";

import HalamanDaftarPembelianStok from "@/features/pembelian-stok/halaman-daftar-pembelian-stok";
import { useLokasiBertipe } from "@/features/inventaris/hooks";

export default function PembelianStokGudangPage() {
  // MVP satu gudang per tenant: GET /pembelianstok hanya menyaring satu
  // locationID, sehingga ruang gudang memakai lokasi bertipe Gudang yang pertama.
  const gudang = useLokasiBertipe("Gudang");
  // Lokasi yang gagal dimuat dan gudang yang belum ada dihadang layout ruang
  // gudang (tentukanAksesGudang, kunci query yang sama) sebelum halaman ini.

  return (
    <HalamanDaftarPembelianStok
      ruang="gudang"
      lokasiID={gudang.lokasiId || null}
      memuatLingkup={gudang.isLoading}
      deskripsi="Bahan baku yang dibeli dari supplier dan masuk ke stok gudang."
    />
  );
}