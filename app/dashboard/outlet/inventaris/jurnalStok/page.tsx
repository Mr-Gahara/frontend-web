"use client";

import { useMemo, useState, type ReactNode } from "react";
import HalamanJurnalStok from "@/features/jurnal-stok/halaman-jurnal-stok";
import { lokasiJurnalOutlet } from "@/features/jurnal-stok/filter";
import { useCakupanLokasiOutlet } from "@/features/inventaris/hooks";
import { SEMUA_OUTLET } from "@/features/inventaris/cakupan";
import PemilihLokasiOutlet from "@/features/inventaris/pemilih-lokasi-outlet";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";

export default function JurnalStokOutletPage() {
  // Pemegang izin lintas outlet melihat seluruh outlet (dengan pemilih); pengguna lain hanya outlet tenant.
  const cakupan = useCakupanLokasiOutlet();
  const [pilihanLokasi, setPilihanLokasi] = useState<string>(SEMUA_OUTLET);

  // GET /jurnalstok hanya menyaring satu locationID (lokasiJurnalOutlet).
  const lokasi = useMemo(() => lokasiJurnalOutlet(cakupan, pilihanLokasi), [cakupan, pilihanLokasi]);

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
        isi="Sistem keamanan mencegah penampilan Jurnal Stok karena lokasi kerja Anda saat ini belum dikonfigurasi. Harap periksa pengaturan profil lokasi Anda."
      />
    );
  }

  if (!penghalang && lokasi && "pilihSatuOutlet" in lokasi) {
    penghalang = (
      <PesanLokasi
        judul="Pilih Satu Outlet"
        isi="Jurnal stok ditampilkan per outlet. Pilih outlet di kotak lokasi untuk melihat jurnalnya."
      />
    );
  }

  let namaCakupan = "Outlet Saat Ini";
  if (cakupan.status === "lintas") {
    namaCakupan =
      pilihanLokasi === SEMUA_OUTLET
        ? "seluruh outlet"
        : (cakupan.lokasiOutlet.find((l) => l.id === pilihanLokasi)?.nama ?? "outlet terpilih");
  } else if (cakupan.status === "terkunci" && cakupan.lokasi) {
    namaCakupan = cakupan.lokasi.nama;
  }

  return (
    <HalamanJurnalStok
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
          CCTV Operasional: Melacak riwayat masuk-keluar barang khusus di{" "}
          <strong className="text-navy">{namaCakupan}</strong>.
        </>
      }
    />
  );
}
