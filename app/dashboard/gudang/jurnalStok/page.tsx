"use client";

import type { ReactNode } from "react";
import HalamanJurnalStok from "@/features/jurnal-stok/halaman-jurnal-stok";
import { useLokasiBertipe } from "@/features/inventaris/hooks";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";

export default function JurnalStokGudangPage() {
  // MVP satu gudang per tenant: GET /jurnalstok hanya menyaring satu locationID,
  // sehingga ruang gudang memakai lokasi bertipe Gudang yang pertama.
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
        isi="Jurnal stok gudang tampil setelah gudang didaftarkan di pengaturan gudang."
      />
    );
  }

  return (
    <HalamanJurnalStok
      ruang="gudang"
      lokasiID={gudang.lokasiId || null}
      memuatLingkup={gudang.isLoading}
      penghalang={penghalang}
      deskripsi="Rekam jejak pergerakan keluar-masuk barang di Gudang Pusat. Data tidak dapat dimanipulasi."
    />
  );
}
