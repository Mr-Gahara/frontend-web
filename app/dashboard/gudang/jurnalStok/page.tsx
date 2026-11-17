"use client";

import HalamanJurnalStok from "@/features/jurnal-stok/halaman-jurnal-stok";
import { useLokasiBertipe } from "@/features/inventaris/hooks";

export default function JurnalStokGudangPage() {
  // MVP satu gudang per tenant: GET /jurnalstok hanya menyaring satu locationID,
  // sehingga ruang gudang memakai lokasi bertipe Gudang yang pertama.
  const gudang = useLokasiBertipe("Gudang");
  // Lokasi yang gagal dimuat dan gudang yang belum ada dihadang layout ruang
  // gudang (tentukanAksesGudang, kunci query yang sama) sebelum halaman ini.

  return (
    <HalamanJurnalStok
      ruang="gudang"
      lokasiID={gudang.lokasiId || null}
      memuatLingkup={gudang.isLoading}
      deskripsi="Rekam jejak pergerakan keluar-masuk barang di Gudang Pusat. Data tidak dapat dimanipulasi."
    />
  );
}
