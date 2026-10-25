"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { isNotFound, pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import { tahapPengajuan, type TahapPengajuan } from "./tahap";
import { useAjukanPengajuan, usePengajuanStok } from "./hooks";
import { bolehUbahPengajuan } from "./izin";
import { arahLokasi } from "./arah";
import { LABEL_ARAH_PENGAJUAN, LABEL_TAHAP_PENGAJUAN, formatTanggalPengajuan } from "./tampilan";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Send,
  FileEdit,
  MapPin,
  Package,
  CalendarClock,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from "lucide-react";

const URL_DAFTAR = "/dashboard/outlet/inventaris/pengajuanStok";

function badgeTahap(tahap: TahapPengajuan) {
  switch (tahap) {
    case "DRAFT":
      return (
        <Badge className="bg-slate-200 text-slate-700 border-none font-bold text-sm px-4 py-1">
          {LABEL_TAHAP_PENGAJUAN.outlet.DRAFT}
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-sm px-4 py-1">
          <Clock className="w-4 h-4 mr-1.5" /> {LABEL_TAHAP_PENGAJUAN.outlet.SUBMITTED}
        </Badge>
      );
    case "PERLU_SURAT_JALAN":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-sm px-4 py-1">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> {LABEL_TAHAP_PENGAJUAN.outlet.PERLU_SURAT_JALAN}
        </Badge>
      );
    case "SURAT_JALAN_DIBUAT":
      return (
        <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold text-sm px-4 py-1">
          {LABEL_TAHAP_PENGAJUAN.outlet.SURAT_JALAN_DIBUAT}
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-sm px-4 py-1">
          {LABEL_TAHAP_PENGAJUAN.outlet.COMPLETED}
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-rose-100 text-rose-700 border-none font-bold text-sm px-4 py-1">
          <XCircle className="w-4 h-4 mr-1.5" /> {LABEL_TAHAP_PENGAJUAN.outlet.REJECTED}
        </Badge>
      );
    default:
      return <Badge variant="outline">{tahap}</Badge>;
  }
}

export default function HalamanDetailPengajuanOutlet() {
  const router = useRouter();
  const id = useParams().id as string;
  const { permissions } = useSession();
  const bolehUbah = bolehUbahPengajuan(permissions ?? []);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const { data: detail, isLoading, error } = usePengajuanStok(id);

  // Dialog ditutup hanya saat berhasil; saat gagal tetap terbuka (keputusan Fase 0).
  const submitMutation = useAjukanPengajuan(id, {
    onSuccess: () => {
      toast.success("Berhasil Diajukan", {
        description: "Pengajuan stok telah dikirim ke Gudang untuk ditinjau.",
      });
      setShowConfirmSubmit(false);
    },
    onError: (err) =>
      toast.error("Gagal Mengajukan", { description: pesanError(err, "Gagal mengajukan pengajuan.") }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64 bg-navy/10" />
        <Skeleton className="h-64 w-full bg-navy/10 rounded-2xl" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-navy">
          {!error || isNotFound(error)
            ? "Data tidak ditemukan"
            : "Gagal memuat pengajuan. Coba muat ulang halaman."}
        </h2>
        <Button variant="link" onClick={() => router.push(URL_DAFTAR)} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  // Status menentukan tahap; izin menentukan siapa yang boleh bertindak (butir 14).
  const bisaDiubah = detail.status === "DRAFT" && bolehUbah;
  const arah = arahLokasi(detail.dariLokasi, detail.keLokasi);
  const pengembalian = arah === "OUTLET_KE_GUDANG";

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-5xl mx-auto">
      {/* HEADER & STATUS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-navy/10 pb-6">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-navy/60 hover:bg-transparent hover:text-navy font-semibold transition-colors"
            onClick={() => router.push(URL_DAFTAR)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Pengajuan
          </Button>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black font-mono tracking-tight text-navy">
              {detail.nomorPengajuan}
            </h1>
            <div className="flex items-center gap-3 text-sm font-medium text-navy/60">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" /> {arah ? LABEL_ARAH_PENGAJUAN[arah] : "-"}
              </span>
              <span>•</span>
              <span>Dibuat: {formatTanggalPengajuan(detail.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          {badgeTahap(tahapPengajuan(detail))}
        </div>
      </div>

      {/* JIKA REJECTED: Tampilkan Alasan */}
      {detail.status === "REJECTED" && detail.catatanPenolakan && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-sm font-bold text-rose-700 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Alasan Penolakan:
          </span>
          <p className="text-sm font-medium text-rose-600 pl-6">{detail.catatanPenolakan}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* KOLOM KIRI: DETAIL ITEM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-navy/10 bg-white shadow-sm overflow-hidden">
            <div className="bg-krem px-6 py-4 border-b border-navy/10 flex items-center gap-2">
              <Package className="w-5 h-5 text-karamel" />
              <h2 className="font-bold text-navy">{pengembalian ? "Barang yang Dikembalikan" : "Daftar Barang yang Diminta"}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gading text-xs uppercase font-bold text-navy/50 border-b border-navy/5">
                  <tr>
                    <th className="px-6 py-4">Nama Barang</th>
                    <th className="px-6 py-4 text-center">Jumlah Diajukan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/5">
                  {detail.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gading/50">
                      <td className="px-6 py-4 font-bold text-navy">
                        {item.bahanBaku?.namaBahan || "Item Tidak Dikenal"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-navy bg-navy/5 px-3 py-1 rounded-md">
                          {item.jumlah}{" "}
                          <span className="text-xs font-sans font-medium text-navy/60">
                            {item.satuan}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Tambahan */}
          {detail.catatan && (
            <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm space-y-2">
              <h3 className="font-bold text-navy text-sm">Catatan Pengajuan:</h3>
              <p className="text-sm font-medium text-navy/70 italic bg-gading p-4 rounded-xl border border-navy/5">
                &quot;{detail.catatan}&quot;
              </p>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: INFO RUTE & TIMELINE */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-navy flex items-center gap-2 border-b border-navy/10 pb-3">
              <MapPin className="w-4 h-4 text-karamel" /> Rute Pengiriman
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col gap-1 relative pl-6">
                <div className="absolute left-0.75 top-1.5 w-2 h-2 rounded-full bg-navy" />
                <div className="absolute left-1.5 top-4 -bottom-4 w-0.5 bg-navy/10" />
                <span className="text-xs font-bold text-navy/50 uppercase">{pengembalian ? "Outlet Asal Barang" : "Gudang Asal"}</span>
                <span className="font-bold text-navy">{detail.dariLokasi?.nama || "-"}</span>
              </div>
              <div className="flex flex-col gap-1 relative pl-6">
                <div className="absolute left-0.75 top-1.5 w-2 h-2 rounded-full bg-karamel" />
                <span className="text-xs font-bold text-navy/50 uppercase">{pengembalian ? "Gudang Tujuan" : "Outlet Peminta"}</span>
                <span className="font-bold text-navy">{detail.keLokasi?.nama || "-"}</span>
              </div>
            </div>

            <div className="border-t border-navy/10 pt-4 mt-2 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-navy/60 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4" /> Batas Waktu
                </span>
                <span className="font-bold text-navy">
                  {detail.tanggalKebutuhan ? formatTanggalPengajuan(detail.tanggalKebutuhan) : "Fleksibel"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-navy/60">Pembuat Draft</span>
                <span className="font-bold text-navy capitalize">
                  {detail.dimintaOleh?.nama || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS: DRAFT dan pemegang update-pengajuan-stok */}
          {bisaDiubah && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-bold text-amber-800 text-center mb-1">Tindakan Dokumen</h3>
              <Button
                variant="outline"
                onClick={() => router.push(`${URL_DAFTAR}/${id}/edit`)}
                className="w-full bg-white border-amber-200 text-amber-700 hover:bg-amber-100 font-bold cursor-pointer"
              >
                <FileEdit className="w-4 h-4 mr-2" /> Revisi Draft
              </Button>
              <Button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full bg-navy text-white hover:bg-navy/90 font-bold shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4 mr-2" /> Ajukan ke Gudang
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL KONFIRMASI SUBMIT */}
      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent className="bg-gading border-navy/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Kirim Pengajuan ke Gudang?</AlertDialogTitle>
            <AlertDialogDescription className="text-navy/70 font-medium">
              Setelah diajukan, status akan berubah menjadi{" "}
              <strong className="text-amber-600">MENUNGGU</strong> dan dokumen ini tidak dapat
              direvisi lagi oleh Outlet. Apakah Anda yakin jumlah barang sudah benar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={submitMutation.isPending}
              className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                submitMutation.mutate();
              }}
              disabled={submitMutation.isPending}
              className="cursor-pointer bg-navy text-gading hover:bg-navy/90 font-bold"
            >
              {submitMutation.isPending ? "Memproses..." : "Ya, Ajukan Sekarang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}