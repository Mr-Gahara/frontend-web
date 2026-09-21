"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { isNotFound } from "@/lib/api/error";
import { usePengajuanStok } from "./hooks";
import { FormPengajuanStok } from "./form-pengajuan-stok";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

const URL_DAFTAR = "/dashboard/outlet/inventaris/pengajuanStok";

/**
 * Revisi draft pengajuan. Form dipasang setelah detail termuat ulang saat
 * halaman dibuka, karena nilai awalnya hanya dibaca sekali (butir 8).
 * Selain DRAFT ditolak di sini; backend masih mengizinkan APPROVED dan
 * PENDING diubah (kontrak/temuan.md butir 25).
 */
export default function HalamanEditPengajuanStok() {
  useAuthGuard();
  const router = useRouter();
  const id = useParams().id as string;
  const { data: pengajuan, error, isFetchedAfterMount } = usePengajuanStok(id);

  if (!isFetchedAfterMount) {
    return (
      <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64 bg-[#0A2947]/10" />
        <Skeleton className="h-100 w-full bg-[#0A2947]/10 rounded-2xl" />
      </div>
    );
  }

  if (error || !pengajuan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500/50" />
        <h2 className="text-xl font-bold text-[#0A2947]">
          {!error || isNotFound(error)
            ? "Data tidak ditemukan"
            : "Gagal memuat pengajuan. Coba muat ulang halaman."}
        </h2>
        <Button variant="outline" onClick={() => router.push(URL_DAFTAR)}>
          Kembali
        </Button>
      </div>
    );
  }

  if (pengajuan.status !== "DRAFT") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-500/80" />
        <h2 className="text-xl font-bold text-[#0A2947]">Akses Ditolak</h2>
        <p className="text-sm font-medium text-[#0A2947]/60">
          Dokumen ini sudah berstatus {pengajuan.status} dan tidak dapat direvisi lagi.
        </p>
        <Button
          variant="default"
          className="bg-[#0A2947]"
          onClick={() => router.push(`${URL_DAFTAR}/${id}`)}
        >
          Lihat Detail Saja
        </Button>
      </div>
    );
  }

  return <FormPengajuanStok pengajuan={pengajuan} />;
}