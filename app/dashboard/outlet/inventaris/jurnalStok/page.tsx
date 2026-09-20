"use client";

import { useMemo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import HalamanJurnalStok from "@/features/jurnal-stok/halaman-jurnal-stok";
import type { LingkupJurnal } from "@/features/jurnal-stok/filter";
import { useLokasiAktif } from "@/features/inventaris/hooks";

function PesanLokasi({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm flex flex-col items-center text-center gap-4 py-12">
      <AlertTriangle className="w-12 h-12 text-rose-500" />
      <div>
        <h2 className="text-xl font-bold text-rose-700">{judul}</h2>
        <p className="text-sm font-medium text-rose-600/80 mt-1 max-w-md mx-auto">{isi}</p>
      </div>
    </div>
  );
}

export default function JurnalStokOutletPage() {
  const { lokasi, lokasiId, isLoading, isError } = useLokasiAktif();
  const lingkup = useMemo<LingkupJurnal | null>(
    () => (lokasiId ? { lokasiID: lokasiId } : null),
    [lokasiId],
  );

  let penghalang: ReactNode = null;
  if (isError) {
    penghalang = (
      <PesanLokasi
        judul="Gagal Memuat Lokasi Outlet"
        isi="Lokasi kerja Anda tidak dapat dimuat. Periksa koneksi, lalu muat ulang halaman."
      />
    );
  } else if (!isLoading && !lokasiId) {
    penghalang = (
      <PesanLokasi
        judul="Identitas Outlet Tidak Ditemukan"
        isi="Sistem keamanan mencegah penampilan Jurnal Stok karena lokasi kerja Anda saat ini belum dikonfigurasi. Harap periksa pengaturan profil lokasi Anda."
      />
    );
  }

  return (
    <HalamanJurnalStok
      ruang="outlet"
      lingkup={lingkup}
      memuatLingkup={isLoading}
      penghalang={penghalang}
      deskripsi={
        <>
          CCTV Operasional: Melacak riwayat masuk-keluar barang khusus di{" "}
          <strong className="text-[#0A2947]">{lokasi?.nama ?? "Outlet Saat Ini"}</strong>.
        </>
      }
    />
  );
}
