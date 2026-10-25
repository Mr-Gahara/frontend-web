"use client";

import type { ReactNode } from "react";
import HalamanDaftarPembelianStok from "@/features/pembelian-stok/halaman-daftar-pembelian-stok";
import { useLokasiBertipe } from "@/features/inventaris/hooks";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";

export default function PembelianStokGudangPage() {
  // MVP satu gudang per tenant: GET /pembelianstok hanya menyaring satu
  // locationID, sehingga ruang gudang memakai lokasi bertipe Gudang yang pertama.
  const gudang = useLokasiBertipe("Gudang");

  let penghalang: ReactNode = null;
  if (gudang.isError) {
    penghalang = (
      <PesanLokasi
        judul="Gagal Memuat Lokasi Gudang"
        isi="Lokasi gudang tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman."
      />
    );
  } else if (!gudang.isLoading && !gudang.lokasiId) {
    penghalang = (
      <PesanLokasi
        judul="Gudang Belum Didaftarkan"
        isi="Pembelian stok gudang tampil setelah gudang didaftarkan di pengaturan gudang."
      />
    );
  }

  return (
    <HalamanDaftarPembelianStok
      ruang="gudang"
      lokasiID={gudang.lokasiId || null}
      memuatLingkup={gudang.isLoading}
      penghalang={penghalang}
      deskripsi="Bahan baku yang dibeli dari supplier dan masuk ke stok gudang."
    />
  );
}