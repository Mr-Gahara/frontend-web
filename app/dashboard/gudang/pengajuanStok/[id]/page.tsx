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
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MapPin,
  Package,
  CalendarClock,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Check,
  X,
  Truck,
  AlertTriangle,
} from "lucide-react";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMMM yyyy, HH:mm", { locale: localeID });
};

const getStatusBadge = (status: StatusPengajuan) => {
  switch (status) {
    case "SUBMITTED":
    case "PENDING":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-sm px-4 py-1">
          <Clock className="w-4 h-4 mr-1.5" /> Perlu Tinjauan
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-sm px-4 py-1">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Siap Dikirim
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

export default function DetailPengajuanStokGudangPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);

  // --- Modal States ---
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [alasanTolak, setAlasanTolak] = useState("");

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
  const approveMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.patch<any>(
        `/pengajuanStok/${id}/approve`,
        {},
        undefined,
        "pengguna",
      );
    },
    onSuccess: (res) => {
      toast.success("Pengajuan Disetujui", {
        description:
          res.message || "Dokumen siap diproses ke tahap Surat Jalan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengajuanStok() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pengajuanStokDetail(id),
      });
      setShowConfirmApprove(false);
    },
    onError: (err: any) => {
      toast.error("Gagal Menyetujui", { description: err.message });
      setShowConfirmApprove(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.pengajuanStokDetail(id) });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!alasanTolak.trim()) throw new Error("Alasan penolakan wajib diisi.");
      return await apiClient.patch<any>(
        `/pengajuanStok/${id}/reject`,
        { alasan: alasanTolak },
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Pengajuan Ditolak", {
        description: "Penolakan dan alasannya telah dikirim ke Outlet.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengajuanStok() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pengajuanStokDetail(id),
      });
      setShowRejectModal(false);
      setAlasanTolak("");
    },
    onError: (err: any) => {
      toast.error("Gagal Menolak", { description: err.message });
    },
  });

  // Mutasi Baru: Membuat Surat Jalan (Transfer Stok)
  const createTransferMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pengajuanStokID: id,
        tanggalKirim: new Date().toISOString(), // Default dikirim hari ini
      };
      return await apiClient.post<any>(
        "/transferStok",
        payload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: (res) => {
      toast.success("Surat Jalan Berhasil Dibuat", {
        description: "Draft pengiriman telah disiapkan.",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pengajuanStokDetail(id),
      });

      // Auto-redirect ke laman Surat Jalan yang baru terbentuk
      const newTransferId = res.data?.id || res.data?._id;
      if (newTransferId) {
        router.push(`/dashboard/gudang/transferStok/${newTransferId}`);
      } else {
        router.push(`/dashboard/gudang/transferStok`);
      }
    },
    onError: (err: any) => {
      toast.error("Gagal Membuat Surat Jalan", { description: err.message });
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

  const isSubmitted = detail.status === "SUBMITTED";
  const isApproved = detail.status === "APPROVED";
  const hasSuratJalan = !!detail.transferStokID;

  // DETEKSI STOK KURANG
  const isStockInsufficient = detail.items.some(
    (item) => item.jumlah > (item.stokGudangSaatIni || 0),
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-5xl mx-auto">
      {/* HEADER & STATUS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#0A2947]/10 pb-6">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
            onClick={() => router.push("/dashboard/gudang/pengajuanStok")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Inbox Permintaan
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
                Rincian Kebutuhan Outlet
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FFFAF3] text-xs uppercase font-bold text-[#0A2947]/50 border-b border-[#0A2947]/5">
                  <tr>
                    <th className="px-6 py-4">Nama Barang</th>
                    <th className="px-6 py-4 text-center">Permintaan</th>
                    <th className="px-6 py-4 text-center">Stok Gudang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A2947]/5">
                  {detail.items.map((item, index) => {
                    const stokTersedia = item.stokGudangSaatIni || 0;
                    const isKurang = item.jumlah > stokTersedia;

                    return (
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
                        <td className="px-6 py-4 text-center">
                          <span
                            className={cn(
                              "font-mono font-bold px-3 py-1 rounded-md flex items-center justify-center gap-1.5 w-fit mx-auto",
                              isKurang
                                ? "bg-rose-50 text-rose-600"
                                : "bg-emerald-50 text-emerald-700",
                            )}
                          >
                            {isKurang && (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            )}
                            {stokTersedia}{" "}
                            <span
                              className={cn(
                                "text-xs font-sans font-medium",
                                isKurang
                                  ? "text-rose-600/70"
                                  : "text-emerald-700/70",
                              )}
                            >
                              {item.satuan}
                            </span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Tambahan */}
          {detail.catatan && (
            <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm space-y-2">
              <h3 className="font-bold text-[#0A2947] text-sm">
                Pesan Khusus dari Outlet:
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
              <MapPin className="w-4 h-4 text-[#D4A373]" /> Informasi Logistik
            </h2>

            <div className="space-y-4">
              <div className="flex flex-col gap-1 relative pl-6">
                <div className="absolute left-0.75 top-1.5 w-2 h-2 rounded-full bg-[#0A2947]" />
                <div className="absolute left-1.5 top-4 -bottom-4 w-0.5 bg-[#0A2947]/10" />
                <span className="text-xs font-bold text-[#0A2947]/50 uppercase">
                  Peminta Pasokan
                </span>
                <span className="font-bold text-[#0A2947]">
                  {detail.dariLokasi?.nama || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1 relative pl-6">
                <div className="absolute left-0.75 top-1.5 w-2 h-2 rounded-full bg-[#D4A373]" />
                <span className="text-xs font-bold text-[#0A2947]/50 uppercase">
                  Lokasi Kita (Gudang)
                </span>
                <span className="font-bold text-[#0A2947]">
                  {detail.keLokasi?.nama || "-"}
                </span>
              </div>
            </div>

            <div className="border-t border-[#0A2947]/10 pt-4 mt-2 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#0A2947]/60 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4" /> Batas Waktu Tiba
                </span>
                <span className="font-bold text-[#0A2947] text-right">
                  {detail.tanggalKebutuhan
                    ? formatTanggal(detail.tanggalKebutuhan)
                    : "Fleksibel"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#0A2947]/60">PIC Outlet</span>
                <span className="font-bold text-[#0A2947] capitalize text-right">
                  {detail.dimintaOleh?.nama || "-"}
                </span>
              </div>

              {/* Tampilkan PIC Gudang jika sudah diproses */}
              {!isSubmitted && (detail.disetujuiOleh || detail.ditolakOleh) && (
                <div className="flex justify-between items-center text-sm border-t border-[#0A2947]/5 pt-2">
                  <span className="font-bold text-[#0A2947]/60">
                    Diproses Oleh
                  </span>
                  <span className="font-bold text-[#0A2947] capitalize text-right">
                    {detail.disetujuiOleh?.nama ||
                      detail.ditolakOleh?.nama ||
                      "-"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS (JIKA SUBMITTED) */}
          {isSubmitted && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-bold text-emerald-900 text-center mb-1">
                Tindakan Validasi Gudang
              </h3>

              {isStockInsufficient && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl mb-2 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-rose-700 leading-snug">
                    Persetujuan dikunci karena stok gudang tidak mencukupi.
                    Silakan tolak pengajuan atau lakukan opname stok terlebih
                    dahulu.
                  </p>
                </div>
              )}

              <Button
                onClick={() => setShowConfirmApprove(true)}
                disabled={isStockInsufficient || approveMutation.isPending}
                className={cn(
                  "w-full font-bold shadow-md transition-colors",
                  isStockInsufficient
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer",
                )}
              >
                <Check className="w-4 h-4 mr-2" /> Setujui Permintaan
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(true)}
                className="w-full bg-white border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold cursor-pointer"
              >
                <X className="w-4 h-4 mr-2" /> Tolak Permintaan
              </Button>
            </div>
          )}

          {/* ACTION BUTTONS (JIKA APPROVED & BELUM ADA SJ) */}
          {isApproved && !hasSuratJalan && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-bold text-blue-900 text-center mb-1">
                Tindakan Eksekusi Logistik
              </h3>
              <Button
                onClick={() => createTransferMutation.mutate()}
                disabled={createTransferMutation.isPending}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-md cursor-pointer"
              >
                <Truck className="w-4 h-4 mr-2" />
                {createTransferMutation.isPending
                  ? "Memproses..."
                  : "Buat Surat Jalan"}
              </Button>
              <p className="text-[10px] font-medium text-blue-800/60 text-center">
                Sistem otomatis menarik data item untuk divalidasi ke dalam
                Surat Jalan (Draft).
              </p>
            </div>
          )}

          {/* ACTION BUTTONS (JIKA SUDAH ADA SJ) */}
          {hasSuratJalan && (
            <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm flex flex-col gap-3">
              <h3 className="text-sm font-bold text-[#0A2947] text-center mb-1">
                Dokumen Terkait
              </h3>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(
                    `/dashboard/gudang/transferStok/${detail.transferStokID}`,
                  )
                }
                className="w-full border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" /> Lihat Surat Jalan
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL KONFIRMASI APPROVE */}
      <AlertDialog
        open={showConfirmApprove}
        onOpenChange={setShowConfirmApprove}
      >
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Setujui Permintaan Outlet?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Pastikan stok di gudang Anda mencukupi. Setelah disetujui, Anda
              harus membuat Surat Jalan (Transfer Stok) untuk mengirimkan barang
              ini secara fisik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={approveMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="cursor-pointer bg-emerald-600 text-[#FFFAF3] hover:bg-emerald-700 font-bold border-none"
            >
              {approveMutation.isPending
                ? "Memproses..."
                : "Ya, Setujui Sekarang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL REJECT (BUTUH ALASAN) */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="bg-[#FFFAF3] border-[#0A2947]/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Tolak Permintaan
            </DialogTitle>
            <DialogDescription className="text-[#0A2947]/70 font-medium pt-2">
              Berikan alasan penolakan agar staf Outlet mengetahui kendalanya
              (misal: stok gudang kosong, permintaan terlalu banyak).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Ketik alasan penolakan di sini..."
              value={alasanTolak}
              onChange={(e) => setAlasanTolak(e.target.value)}
              className="bg-white border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-rose-500 resize-none font-medium"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowRejectModal(false)}
              className="font-bold text-[#0A2947]/60 hover:text-[#0A2947] cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || !alasanTolak.trim()}
              className="bg-rose-600 text-white hover:bg-rose-700 font-bold shadow-md cursor-pointer"
            >
              {rejectMutation.isPending ? "Memproses..." : "Tolak Permintaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
