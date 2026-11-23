"use client";

import { useRouter, useParams } from "next/navigation";
import { useTarif } from "@/features/tarif/hooks";
import { FormTarif } from "@/features/tarif/form-tarif";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

/**
 * Detail dimuat ulang setiap halaman dibuka, dan form baru dipasang setelah
 * pemuatan itu selesai, sehingga defaultValues selalu berasal dari data
 * terbaru (keputusan rancangan butir 8). Sebelumnya form diisi lewat reset()
 * di effect, yang menimpa isian pengguna setiap kali detail dimuat ulang.
 */
export default function EditTarifPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id as string;
  // Proteksi ID tidak valid
  const tarifId = rawId === "undefined" || !rawId ? null : rawId;
  const { data: tarif, isLoading, isError, isFetchedAfterMount } = useTarif(tarifId);

  if (!tarifId) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-subjudul font-bold text-navy">
          ID Tarif Tidak Valid
        </h2>
        <p className="text-isi font-medium text-navy/80">
          Sistem mendeteksi bahwa ID tarif pada URL ini rusak atau &quot;undefined&quot;.
        </p>
        <Button
          onClick={() => router.push("/dashboard/outlet/reservasi/tarif")}
          className="mt-4 bg-navy text-gading hover:bg-navy/90 font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Tarif
        </Button>
      </div>
    );
  }

  if (isLoading || !isFetchedAfterMount) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-navy" />
        <p className="text-isi font-bold text-navy/80">
          Memuat data tarif...
        </p>
      </div>
    );
  }

  if (isError || !tarif) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-subjudul font-bold text-navy">
          Data Tidak Ditemukan
        </h2>
        <p className="text-isi font-medium text-navy/80">
          Gagal mengambil data tarif. Data mungkin sudah dihapus atau server
          sedang bermasalah.
        </p>
        <Button
          onClick={() => router.push("/dashboard/outlet/reservasi/tarif")}
          className="mt-4 bg-navy text-gading hover:bg-navy/90 font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return <FormTarif tarif={tarif} />;
}
