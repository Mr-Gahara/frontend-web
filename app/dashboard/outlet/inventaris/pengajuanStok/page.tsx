"use client";

import { useState, type ReactNode } from "react";
import HalamanDaftarPengajuanStok from "@/features/pengajuan-stok/halaman-daftar-pengajuan-stok";
import { useCakupanLokasiOutlet } from "@/features/inventaris/hooks";
import { lingkupOutlet, SEMUA_OUTLET } from "@/features/inventaris/cakupan";
import PemilihLokasiOutlet from "@/features/inventaris/pemilih-lokasi-outlet";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";

export default function PengajuanStokOutletPage() {
  // Pemegang izin lintas outlet melihat seluruh outlet (dengan pemilih); pengguna lain hanya outlet tenant.
  const cakupan = useCakupanLokasiOutlet();
  const [pilihanLokasi, setPilihanLokasi] = useState<string>(SEMUA_OUTLET);

  let penghalang: ReactNode = null;
  if (cakupan.status === "gagal") {
    penghalang = (
      <PesanLokasi
        judul="Gagal Memuat Lokasi Outlet"
        isi="Lokasi kerja Anda tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman."
      />
    );
  } else if (cakupan.status === "terkunci" && !cakupan.lokasiId) {
    penghalang = (
      <PesanLokasi
        judul="Identitas Outlet Tidak Ditemukan"
        isi="Lokasi kerja Anda saat ini belum dikonfigurasi, sehingga pengajuan stok tidak dapat ditampilkan. Harap periksa pengaturan profil lokasi Anda."
      />
    );
  }

  return (
    <HalamanDaftarPengajuanStok
      ruang="outlet"
      lingkup={lingkupOutlet(cakupan, pilihanLokasi)}
      memuatLingkup={cakupan.status === "memuat"}
      penghalang={penghalang}
      pemilihLokasi={
        cakupan.status === "lintas" ? (
          <PemilihLokasiOutlet lokasiOutlet={cakupan.lokasiOutlet} nilai={pilihanLokasi} onUbah={setPilihanLokasi} />
        ) : undefined
      }
    />
  );
}
