"use client";

import { useMemo, useState, type ReactNode } from "react";
import HalamanJurnalStok from "@/features/jurnal-stok/halaman-jurnal-stok";
import type { LingkupJurnal } from "@/features/jurnal-stok/filter";
import { useCakupanLokasiOutlet } from "@/features/inventaris/hooks";
import { lingkupOutlet, SEMUA_OUTLET } from "@/features/inventaris/cakupan";
import PemilihLokasiOutlet from "@/features/inventaris/pemilih-lokasi-outlet";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";

export default function JurnalStokOutletPage() {
  // Pemegang izin lintas outlet melihat seluruh outlet (dengan pemilih); pengguna lain hanya outlet tenant.
  const cakupan = useCakupanLokasiOutlet();
  const [pilihanLokasi, setPilihanLokasi] = useState<string>(SEMUA_OUTLET);

  // Jurnal disaring di klien, jadi lingkup diterjemahkan ke bentuk LingkupJurnal.
  const lingkup = useMemo<LingkupJurnal | null>(() => {
    const hasil = lingkupOutlet(cakupan, pilihanLokasi);
    if (!hasil) return null;
    return hasil.locationID
      ? { lokasiID: hasil.locationID }
      : { tipeLokasi: hasil.tipeLokasi ?? "Outlet" };
  }, [cakupan, pilihanLokasi]);

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
        ) : undefined
      }
      deskripsi={
        <>
          CCTV Operasional: Melacak riwayat masuk-keluar barang khusus di{" "}
          <strong className="text-[#0A2947]">{namaCakupan}</strong>.
        </>
      }
    />
  );
}
