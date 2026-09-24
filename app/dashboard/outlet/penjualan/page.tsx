"use client";

import { useState, type ReactNode } from "react";
import HalamanDaftarPenjualan from "@/features/penjualan/halaman-daftar-penjualan";
import { useCakupanLokasiOutlet, useLokasiAktif } from "@/features/inventaris/hooks";
import { SEMUA_OUTLET } from "@/features/inventaris/cakupan";
import PemilihLokasiOutlet from "@/features/inventaris/pemilih-lokasi-outlet";
import PesanLokasi from "@/features/inventaris/pesan-lokasi";
import { bolehCakupanPenjualan } from "@/features/penjualan/izin";
import { tentukanLingkupPenjualan } from "@/features/penjualan/filter";
import { useSession } from "@/lib/auth/useSession";

export default function PenjualanPage() {
  // Cakupan outlet (keputusan K5b) hanya bagi pemegang read-location (K11b):
  // lokasi tidak dapat dibaca tanpa izin itu, sehingga pengguna lain melihat
  // penjualan seluruh tenant, yang pada MVP satu outlet sama dengan outlet
  // tenant.
  const { sedangMemuat, permissions } = useSession();
  const boleh = bolehCakupanPenjualan(permissions);
  const cakupan = useCakupanLokasiOutlet({ aktif: boleh });
  const outletTenant = useLokasiAktif({ aktif: boleh });
  const [pilihanLokasi, setPilihanLokasi] = useState<string>(SEMUA_OUTLET);
  const lingkup = tentukanLingkupPenjualan({
    sesiMemuat: sedangMemuat,
    bolehCakupan: boleh,
    cakupan,
    pilihan: pilihanLokasi,
    outletTenantId: outletTenant.lokasiId,
    memuatOutletTenant: outletTenant.isLoading,
  });

  let penghalang: ReactNode = null;
  if (boleh && cakupan.status === "gagal") {
    penghalang = (
      <PesanLokasi
        judul="Gagal Memuat Lokasi Outlet"
        isi="Lokasi kerja Anda tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman."
      />
    );
  } else if (boleh && cakupan.status === "terkunci" && !cakupan.lokasiId) {
    penghalang = (
      <PesanLokasi
        judul="Identitas Outlet Tidak Ditemukan"
        isi="Data penjualan tidak dapat ditampilkan karena lokasi outlet belum dikonfigurasi."
      />
    );
  }

  return (
    <HalamanDaftarPenjualan
      lingkup={lingkup}
      penghalang={penghalang}
      pemilihLokasi={
        boleh && cakupan.status === "lintas" ? (
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
