"use client";

import { useMemo, useState, type ReactNode } from "react";
import HalamanDaftarPembelianStok from "@/features/pembelian-stok/halaman-daftar-pembelian-stok";
import { useCakupanLokasiOutlet } from "@/features/inventaris/hooks";
import { SEMUA_OUTLET, lokasiSatuOutlet } from "@/features/inventaris/cakupan";
import PemilihLokasiOutlet from "@/features/inventaris/pemilih-lokasi-outlet";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";

export default function PembelianStokOutletPage() {
  // Pemegang izin lintas outlet melihat seluruh outlet (dengan pemilih); pengguna lain hanya outlet tenant.
  const cakupan = useCakupanLokasiOutlet();
  const [pilihanLokasi, setPilihanLokasi] = useState<string>(SEMUA_OUTLET);

  // GET /pembelianstok hanya menyaring satu locationID (lokasiSatuOutlet).
  const lokasi = useMemo(() => lokasiSatuOutlet(cakupan, pilihanLokasi), [cakupan, pilihanLokasi]);

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
        isi="Pembelian stok tidak dapat ditampilkan karena lokasi kerja Anda belum dikonfigurasi. Periksa pengaturan lokasi outlet."
      />
    );
  }

  if (!penghalang && lokasi && "pilihSatuOutlet" in lokasi) {
    penghalang = (
      <PesanLokasi
        judul="Pilih Satu Outlet"
        isi="Pembelian stok ditampilkan per outlet. Pilih outlet di kotak lokasi untuk melihat pembeliannya."
      />
    );
  }

  let namaCakupan = "outlet saat ini";
  if (cakupan.status === "lintas") {
    namaCakupan =
      pilihanLokasi === SEMUA_OUTLET
        ? "seluruh outlet"
        : (cakupan.lokasiOutlet.find((l) => l.id === pilihanLokasi)?.nama ?? "outlet terpilih");
  } else if (cakupan.status === "terkunci" && cakupan.lokasi) {
    namaCakupan = cakupan.lokasi.nama;
  }

  return (
    <HalamanDaftarPembelianStok
      ruang="outlet"
      lokasiID={lokasi && "lokasiID" in lokasi ? lokasi.lokasiID : null}
      memuatLingkup={cakupan.status === "memuat"}
      penghalang={penghalang}
      pemilihLokasi={
        cakupan.status === "lintas" ? (
          <PemilihLokasiOutlet
            lokasiOutlet={cakupan.lokasiOutlet}
            nilai={pilihanLokasi}
            onUbah={setPilihanLokasi}
          />
        ) : undefined
      }
      deskripsi={
        <>
          Bahan baku yang dibeli dari supplier dan masuk ke stok{" "}
          <strong className="text-navy">{namaCakupan}</strong>.
        </>
      }
    />
  );
}