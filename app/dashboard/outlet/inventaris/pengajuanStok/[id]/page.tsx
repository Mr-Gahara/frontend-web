"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { PengajuanStok, StatusPengajuan } from "@/types/pengajuanStok";

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

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMMM yyyy, HH:mm", { locale: localeID });
};

const getStatusBadge = (status: StatusPengajuan) => {
  switch (status) {
    case "DRAFT":
      return (
        <Badge className="bg-slate-200 text-slate-700 border-none font-bold text-sm px-4 py-1">
          Konsep (Draft)
        </Badge>
      );
    case "SUBMITTED":
    case "PENDING":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-sm px-4 py-1">
          <Clock className="w-4 h-4 mr-1.5" /> Menunggu Persetujuan Gudang
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-sm px-4 py-1">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Telah Disetujui
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-sm px-4 py-1">
          Selesai
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-rose-100 text-rose-700 border-none font-bold text-sm px-4 py-1">
          <XCircle className="w-4 h-4 mr-1.5" /> Ditolak
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function DetailPengajuanStokPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);

  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // --- Queries ---
  const { data: detail, isLoading } = useQuery({
    queryKey: queryKeys.pengajuanStokDetail(id),
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/pengajuanStok/${id}`,
        undefined,
        "pengguna",
      );
      return (res.data?.data || res.data) as PengajuanStok;
    },
  });

  // --- Mutations ---
  const submitMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.patch<any>(
        `/pengajuanStok/${id}/submit`,
        {},
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil Diajukan", {
        description: "Permintaan stok telah dikirim ke Gudang Pusat.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengajuanStok() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pengajuanStokDetail(id),
      });
      setShowConfirmSubmit(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Mengajukan", { description: err.message });
      setShowConfirmSubmit(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64 bg-[#0A2947]/10" />
        <Skeleton className="h-64 w-full bg-[#0A2947]/10 rounded-2xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-[#0A2947]">
          Data tidak ditemukan
        </h2>
        <Button variant="link" onClick={() => router.back()} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  const isDraft = detail.status === "DRAFT";

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-5xl mx-auto">
      {/* HEADER & STATUS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0A2947]/10 pb-6">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
            onClick={() =>
              router.push("/dashboard/outlet/inventaris/pengajuanStok")
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Pengajuan
          </Button>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black font-mono tracking-tight text-[#0A2947]">
              {detail.nomorPengajuan}
            </h1>
            <div className="flex items-center gap-3 text-sm font-medium text-[#0A2947]/60">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" /> {detail.jenisPengajuan}
              </span>
              <span>•</span>
              <span>Dibuat: {formatTanggal(detail.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          {getStatusBadge(detail.status)}
        </div>
      </div>

      {/* JIKA REJECTED: Tampilkan Alasan */}
      {detail.status === "REJECTED" && detail.catatanPenolakan && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-sm font-bold text-rose-700 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Alasan Penolakan:
          </span>
          <p className="text-sm font-medium text-rose-600 pl-6">
            {detail.catatanPenolakan}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* KOLOM KIRI: DETAIL ITEM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[#0A2947]/10 bg-white shadow-sm overflow-hidden">
            <div className="bg-[#F2EAE1] px-6 py-4 border-b border-[#0A2947]/10 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D4A373]" />
              <h2 className="font-bold text-[#0A2947]">
                Daftar Barang yang Diminta
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FFFAF3] text-xs uppercase font-bold text-[#0A2947]/50 border-b border-[#0A2947]/5">
                  <tr>
                    <th className="px-6 py-4">Nama Barang</th>
                    <th className="px-6 py-4 text-center">Jumlah Diajukan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A2947]/5">
                  {detail.items.map((item, index) => (
                    <tr key={index} className="hover:bg-[#FFFAF3]/50">
                      <td className="px-6 py-4 font-bold text-[#0A2947]">
                        {item.bahanBaku?.namaBahan || "Item Tidak Dikenal"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-[#0A2947] bg-[#0A2947]/5 px-3 py-1 rounded-md">
                          {item.jumlah}{" "}
                          <span className="text-xs font-sans font-medium text-[#0A2947]/60">
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
            <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm space-y-2">
              <h3 className="font-bold text-[#0A2947] text-sm">
                Catatan Pengajuan:
              </h3>
              <p className="text-sm font-medium text-[#0A2947]/70 italic bg-[#FFFAF3] p-4 rounded-xl border border-[#0A2947]/5">
                "{detail.catatan}"
              </p>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: INFO RUTE & TIMELINE */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-[#0A2947] flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <MapPin className="w-4 h-4 text-[#D4A373]" /> Rute Pengiriman
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col gap-1 relative pl-6">
                <div className="absolute left-0.75 top-1.5 w-2 h-2 rounded-full bg-[#0A2947]" />
                <div className="absolute left-1.5 top-4 -bottom-4 w-0.5 bg-[#0A2947]/10" />
                <span className="text-xs font-bold text-[#0A2947]/50 uppercase">
                  Dari (Peminta)
                </span>
                <span className="font-bold text-[#0A2947]">
                  {detail.dariLokasi?.nama || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1 relative pl-6">
                <div className="absolute left-0.75 top-1.5 w-2 h-2 rounded-full bg-[#D4A373]" />
                <span className="text-xs font-bold text-[#0A2947]/50 uppercase">
                  Tujuan Pengambilan
                </span>
                <span className="font-bold text-[#0A2947]">
                  {detail.keLokasi?.nama || "-"}
                </span>
              </div>
            </div>

            <div className="border-t border-[#0A2947]/10 pt-4 mt-2 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#0A2947]/60 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4" /> Batas Waktu
                </span>
                <span className="font-bold text-[#0A2947]">
                  {detail.tanggalKebutuhan
                    ? formatTanggal(detail.tanggalKebutuhan)
                    : "Fleksibel"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#0A2947]/60">
                  Pembuat Draft
                </span>
                <span className="font-bold text-[#0A2947] capitalize">
                  {detail.dimintaOleh?.nama || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS (HANYA MUNCUL JIKA DRAFT) */}
          {isDraft && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-bold text-amber-800 text-center mb-1">
                Tindakan Dokumen
              </h3>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/dashboard/outlet/inventaris/pengajuanStok/${id}/edit`,
                  )
                }
                className="w-full bg-white border-amber-200 text-amber-700 hover:bg-amber-100 font-bold cursor-pointer"
              >
                <FileEdit className="w-4 h-4 mr-2" /> Revisi Draft
              </Button>
              <Button
                onClick={() => setShowConfirmSubmit(true)}
                className="w-full bg-[#0A2947] text-white hover:bg-[#0A2947]/90 font-bold shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4 mr-2" /> Ajukan ke Gudang Pusat
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL KONFIRMASI SUBMIT */}
      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Kirim Pengajuan ke Gudang?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Setelah diajukan, status akan berubah menjadi{" "}
              <strong className="text-amber-600">MENUNGGU</strong> dan dokumen
              ini tidak dapat direvisi lagi oleh Outlet. Apakah Anda yakin
              jumlah barang sudah benar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={submitMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold"
            >
              {submitMutation.isPending
                ? "Memproses..."
                : "Ya, Ajukan Sekarang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
