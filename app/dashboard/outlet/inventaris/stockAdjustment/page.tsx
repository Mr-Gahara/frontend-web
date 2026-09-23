"use client";

import { useState, type ReactNode } from "react";
import HalamanDaftarStockAdjustment from "@/features/stock-adjustment/halaman-daftar-stock-adjustment";
import { useCakupanLokasiOutlet } from "@/features/inventaris/hooks";
import { lingkupOutlet, SEMUA_OUTLET } from "@/features/inventaris/cakupan";
import PemilihLokasiOutlet from "@/features/inventaris/pemilih-lokasi-outlet";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";

export default function StockAdjustmentListPage() {
  // Ruang outlet hanya menampilkan adjustment lokasi Outlet: stok outlet dan
  // gudang tidak dicampur (keputusan pemilik proyek, 22 September 2026).
  // Pemegang izin lintas outlet melihat seluruh outlet (dengan pemilih);
  // pengguna lain hanya outlet tenant.
  const cakupan = useCakupanLokasiOutlet();
  const [pilihanLokasi, setPilihanLokasi] = useState<string>(SEMUA_OUTLET);
  const lingkup = lingkupOutlet(cakupan, pilihanLokasi);

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
        isi="Jurnal penyesuaian stok tidak dapat ditampilkan karena lokasi outlet belum dikonfigurasi."
      />
    );
  }

  return (
    <HalamanDaftarStockAdjustment
      ruang="outlet"
      lingkup={lingkup}
      memuatLingkup={cakupan.status === "memuat"}
      penghalang={penghalang}
      pemilihLokasi={
        cakupan.status === "lintas" ? (
          <PemilihLokasiOutlet
            lokasiOutlet={cakupan.lokasiOutlet}
            nilai={pilihanLokasi}
            onUbah={setPilihanLokasi}
          />
        ) : null
      }
    />
  );
}
