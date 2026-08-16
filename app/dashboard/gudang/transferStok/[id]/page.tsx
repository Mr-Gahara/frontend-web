"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { TransferStok, StatusTransfer } from "@/types/transferStok";

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
  MapPin,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Send,
  Truck,
  Ban,
  FileEdit,
  ClipboardList,
} from "lucide-react";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMMM yyyy, HH:mm", { locale: localeID });
};

const getStatusBadge = (status: StatusTransfer) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="bg-slate-200 text-slate-700 border-none font-bold text-sm px-4 py-1">
          <Clock className="w-4 h-4 mr-1.5" /> Draft SJ
        </Badge>
      );
    case "DIKIRIM":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-sm px-4 py-1">
          <Send className="w-4 h-4 mr-1.5" /> Sedang Dikirim
        </Badge>
      );
    case "DITERIMA":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-sm px-4 py-1">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Selesai
        </Badge>
      );
    case "BATAL":
      return (
        <Badge className="bg-rose-100 text-rose-700 border-none font-bold text-sm px-4 py-1">
          <XCircle className="w-4 h-4 mr-1.5" /> Dibatalkan
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function DetailTransferStokGudangPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);

  // --- Modal States ---
  const [showConfirmKirim, setShowConfirmKirim] = useState(false);
  const [showConfirmBatal, setShowConfirmBatal] = useState(false);

  // --- Queries ---
  const { data: detail, isLoading } = useQuery({
    queryKey: queryKeys.transferStokDetail(id),
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/transferStok/${id}`,
        undefined,
        "pengguna",
      );
      return (res.data?.data || res.data) as TransferStok;
    },
  });

  // --- Mutations ---
  const kirimMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.patch<any>(
        `/transferStok/${id}/kirim`,
        {},
        undefined,
        "pengguna",
      );
    },
    onSuccess: (res) => {
      toast.success("Barang Berhasil Dikirim", {
        description:
          res.message ||
          "Stok gudang telah terpotong. Menunggu konfirmasi outlet.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.transferStok() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transferStokDetail(id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory() }); // Refresh stok
      setShowConfirmKirim(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Mengirim Barang", { description: err.message });
      setShowConfirmKirim(false);
    },
  });

  const batalMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.patch<any>(
        `/transferStok/${id}/batal`,
        {},
        undefined,
        "pengguna",
      );
    },
    onSuccess: (res) => {
      toast.success("Surat Jalan Dibatalkan", {
        description: res.message || "Dokumen pengiriman telah dibatalkan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.transferStok() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transferStokDetail(id),
      });
      setShowConfirmBatal(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Membatalkan", { description: err.message });
      setShowConfirmBatal(false);
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

  const isPending = detail.status === "PENDING";
  const isDikirim = detail.status === "DIKIRIM";

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-5xl mx-auto">
      {/* HEADER & STATUS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0A2947]/10 pb-6">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
            onClick={() => router.push("/dashboard/gudang/transferStok")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Surat Jalan
          </Button>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-black font-mono tracking-tight text-[#0A2947] flex items-center gap-3">
              {detail.nomorTransfer}
            </h1>
            <div className="flex items-center gap-3 text-sm font-medium text-[#0A2947]/60">
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4" /> Transfer Logistik
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* KOLOM KIRI: DETAIL ITEM */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[#0A2947]/10 bg-white shadow-sm overflow-hidden">
            <div className="bg-[#F2EAE1] px-6 py-4 border-b border-[#0A2947]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#D4A373]" />
                <h2 className="font-bold text-[#0A2947]">Muatan Pengiriman</h2>
              </div>
              <span className="text-xs font-bold bg-white px-3 py-1 rounded-full text-[#0A2947]/60 shadow-sm border border-[#0A2947]/10">
                Total {detail.items.length} Macam Barang
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FFFAF3] text-xs uppercase font-bold text-[#0A2947]/50 border-b border-[#0A2947]/5">
                  <tr>
                    <th className="px-6 py-4">Nama Barang</th>
                    <th className="px-6 py-4 text-center">Dikirim</th>
                    {/* Tampilkan kolom diterima & selisih hanya jika status DITERIMA */}
                    {detail.status === "DITERIMA" && (
                      <>
                        <th className="px-6 py-4 text-center">Diterima</th>
                        <th className="px-6 py-4 text-center">Selisih</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A2947]/5">
                  {detail.items.map((item, index) => (
                    <tr key={index} className="hover:bg-[#FFFAF3]/50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#0A2947]">
                            {item.bahanBaku?.namaBahan || "Item Tidak Dikenal"}
                          </span>
                          {item.catatanItem && (
                            <span className="text-xs text-rose-600 font-medium italic mt-1">
                              Catatan: {item.catatanItem}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-bold text-[#0A2947] bg-[#0A2947]/5 px-3 py-1 rounded-md border border-[#0A2947]/10">
                          {item.qtyKirim}{" "}
                          <span className="text-xs font-sans font-medium text-[#0A2947]/60">
                            {item.bahanBaku?.satuan}
                          </span>
                        </span>
                      </td>
                      {detail.status === "DITERIMA" && (
                        <>
                          <td className="px-6 py-4 text-center font-mono font-bold text-[#0A2947]">
                            {item.qtyTerima}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`font-mono font-bold px-2 py-1 rounded-md ${
                                item.selisih === 0
                                  ? "text-emerald-600 bg-emerald-50"
                                  : "text-rose-600 bg-rose-50"
                              }`}
                            >
                              {item.selisih === 0 ? "Pas" : item.selisih}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: INFO RUTE & ACTION BUTTONS */}
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
                  Asal (Gudang Anda)
                </span>
                <span className="font-bold text-[#0A2947]">
                  {detail.dariLokasi?.nama || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1 relative pl-6">
                <div className="absolute left-0.75 top-1.5 w-2 h-2 rounded-full bg-[#D4A373]" />
                <span className="text-xs font-bold text-[#0A2947]/50 uppercase">
                  Tujuan (Outlet)
                </span>
                <span className="font-bold text-[#0A2947]">
                  {detail.keLokasi?.nama || "-"}
                </span>
              </div>
            </div>

            <div className="border-t border-[#0A2947]/10 pt-4 mt-2 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#0A2947]/60">
                  Pengirim (Gudang)
                </span>
                <span className="font-bold text-[#0A2947] capitalize text-right">
                  {detail.pengirim?.nama || "-"}
                </span>
              </div>

              {/* Tampilkan Penerima jika sudah sampai */}
              {detail.penerima && (
                <div className="flex justify-between items-center text-sm border-t border-[#0A2947]/5 pt-2">
                  <span className="font-bold text-[#0A2947]/60">
                    Penerima (Outlet)
                  </span>
                  <span className="font-bold text-[#0A2947] capitalize text-right">
                    {detail.penerima.nama}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* DOKUMEN TERKAIT (Pengajuan Stok) */}
          {detail.pengajuanStokID && (
            <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-bold text-[#0A2947] text-center mb-1">
                Dokumen Referensi
              </h3>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/dashboard/gudang/pengajuanStok/${detail.pengajuanStokID}`,
                  )
                }
                className="w-full border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold cursor-pointer"
              >
                <ClipboardList className="w-4 h-4 mr-2" /> Lihat Pengajuan
                Outlet
              </Button>
            </div>
          )}

          {/* ACTION BUTTONS (HANYA MUNCUL JIKA PENDING) */}
          {isPending && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-bold text-blue-900 text-center mb-1">
                Eksekusi Keberangkatan
              </h3>
              <Button
                onClick={() => setShowConfirmKirim(true)}
                className="w-full bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4 mr-2" /> Kirim Barang Sekarang
              </Button>
              {/* Optional: Tombol Edit SJ */}
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/dashboard/gudang/transferStok/${id}/edit`)
                }
                className="w-full border-[#0A2947]/20 text-[#0A2947] hover:bg-white font-bold cursor-pointer"
              >
                <FileEdit className="w-4 h-4 mr-2" /> Revisi Kuantitas
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowConfirmBatal(true)}
                className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-100 font-bold cursor-pointer mt-2"
              >
                <Ban className="w-4 h-4 mr-2" /> Batalkan Pengiriman
              </Button>
            </div>
          )}

          {/* ALERT SEDANG DIKIRIM */}
          {isDikirim && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm text-center space-y-2">
              <Truck className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-amber-800">
                Menunggu Outlet
              </h3>
              <p className="text-xs font-medium text-amber-700/80">
                Barang sudah dipotong dari stok Gudang dan sedang dalam
                perjalanan. Menunggu manajer Outlet melakukan konfirmasi
                penerimaan di aplikasi mereka.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL KONFIRMASI KIRIM (EKSEKUSI STOK) */}
      <AlertDialog open={showConfirmKirim} onOpenChange={setShowConfirmKirim}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Konfirmasi Pengiriman Barang?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-rose-600 font-bold bg-rose-50 p-3 rounded-lg border border-rose-200 mt-2">
              PERHATIAN: Tindakan ini akan memotong stok fisik Gudang Anda saat
              ini juga dan status akan berubah menjadi "DIKIRIM". Pastikan
              barang sudah dimuat ke armada pengiriman.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={kirimMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Tunggu Sebentar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => kirimMutation.mutate()}
              disabled={kirimMutation.isPending}
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold border-none"
            >
              {kirimMutation.isPending ? "Memproses..." : "Ya, Kirim Sekarang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL KONFIRMASI BATAL */}
      <AlertDialog open={showConfirmBatal} onOpenChange={setShowConfirmBatal}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <Ban className="w-5 h-5" /> Batalkan Surat Jalan?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Surat Jalan ini akan dibatalkan secara permanen. Jika ini terkait
              dengan permintaan Outlet, status pengajuan mereka akan kembali
              menjadi "Perlu Tinjauan".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={batalMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Tutup
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => batalMutation.mutate()}
              disabled={batalMutation.isPending}
              className="cursor-pointer bg-rose-600 text-white hover:bg-rose-700 font-bold border-none"
            >
              {batalMutation.isPending ? "Memproses..." : "Ya, Batalkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
