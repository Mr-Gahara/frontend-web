"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { StockOpname, StatusOpname, StockAdjustment } from "@/types/stockOpname";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  ClipboardCheck,
  MapPin,
  User,
  Calendar,
  Save,
  Send,
  CheckCircle2,
  XCircle,
  Ban,
  MessageSquare,
  Scale
} from "lucide-react";

// --- HELPERS ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const badgeStatusOpname = (status: StatusOpname) => {
  const map: Record<StatusOpname, string> = {
    DRAFT: "bg-[#D4A373] text-[#0A2947]",
    SUBMITTED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-[#718355] text-[#FFFAF3]",
    REJECTED: "bg-rose-100 text-rose-700",
    CANCELLED: "bg-[#0A2947]/10 text-[#0A2947]/60",
  };
  
  const labels: Record<StatusOpname, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Menunggu Review",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
  };

  const className = map[status] || "bg-[#0A2947]/5 text-[#0A2947]/60";
  return (
    <Badge className={`${className} px-3 py-1 font-bold border-none shadow-sm text-xs`}>
      {labels[status] || status}
    </Badge>
  );
};

export default function StockOpnameGudangDetailPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const opnameID = params.id as string;
  const queryClient = useQueryClient();

  // --- LOCAL STATE (EDITABLE ITEMS) ---
  const [editedItems, setEditedItems] = useState<
    Record<string, { qtyPhysical: string; catatanItem: string }>
  >({});

  // --- MODALS STATE ---
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // --- REASON STATE ---
  const [approveAlasan, setApproveAlasan] = useState("");
  const [rejectCatatan, setRejectCatatan] = useState("");

  // --- FETCH DATA OPNAME ---
  const {
    data: opname,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.stockOpnameDetail(opnameID),
    queryFn: async () => {
      const res = await apiClient.get<any>(`/stockopname/${opnameID}`, undefined, "pengguna");
      return (res.data?.data || res.data) as StockOpname;
    },
    enabled: !!opnameID,
  });

  // Sinkronisasi data ke Local State saat data opname di-load (Untuk status DRAFT/REJECTED)
  useEffect(() => {
    if (opname && (opname.status === "DRAFT" || opname.status === "REJECTED")) {
      const initialMap: Record<string, { qtyPhysical: string; catatanItem: string }> = {};
      opname.items?.forEach((item) => {
        initialMap[item.itemId] = {
          qtyPhysical: item.qtyPhysical !== null && item.qtyPhysical !== undefined ? String(item.qtyPhysical) : "",
          catatanItem: item.catatanItem || "",
        };
      });
      setEditedItems(initialMap);
    }
  }, [opname]);

  // --- MUTATIONS DENGAN STRICT TYPES ---
  
  // 1. Save Draft (Update Items)
  const saveItemsMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        items: Object.entries(editedItems).map(([itemId, data]) => ({
          itemId,
          qtyPhysical: data.qtyPhysical === "" ? null : Number(data.qtyPhysical),
          catatanItem: data.catatanItem.trim() || undefined,
        })),
      };
      return await apiClient.patch<StockOpname>(
        `/stockopname/${opnameID}/items`, 
        payload, 
        undefined, 
        "pengguna"
      );
    },
    onSuccess: () => {
      toast.success("Tersimpan", { description: "Input stok fisik berhasil disimpan sementara." });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOpname() });
    },
    onError: (err: any) => toast.error("Gagal menyimpan", { description: err.message }),
  });

  // 2. Submit for Review
  const submitMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.patch<{ _id: string; nomorOpname: string; status: StatusOpname }>(
        `/stockopname/${opnameID}/submit`, 
        {}, 
        undefined, 
        "pengguna"
      );
    },
    onSuccess: () => {
      toast.success("Berhasil Diajukan", { description: "Sesi opname telah dikunci dan diajukan ke Kepala Gudang." });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOpname() });
      setShowSubmitModal(false);
    },
    onError: (err: any) => toast.error("Gagal mengajukan", { description: err.message }),
  });

  // 3. Approve
  const approveMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.patch<{ opname: StockOpname; adjustment: StockAdjustment }>(
        `/stockopname/${opnameID}/approve`,
        { alasan: approveAlasan.trim() || "Disetujui oleh manajemen gudang" },
        undefined,
        "pengguna"
      );
    },
    onSuccess: () => {
      toast.success("Opname Disetujui", { description: "Penyesuaian stok berhasil dieksekusi oleh sistem." });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOpname() });
      setShowApproveModal(false);
    },
    onError: (err: any) => toast.error("Gagal menyetujui", { description: err.message }),
  });

  // 4. Reject
  const rejectMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.patch<{ _id: string; status: StatusOpname; catatanReview: string }>(
        `/stockopname/${opnameID}/reject`,
        { catatanReview: rejectCatatan.trim() || "Ditolak. Harap hitung ulang fisik barang." },
        undefined,
        "pengguna"
      );
    },
    onSuccess: () => {
      toast.success("Opname Ditolak", { description: "Sesi dikembalikan ke staf untuk direvisi." });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOpname() });
      setShowRejectModal(false);
      setRejectCatatan("");
    },
    onError: (err: any) => toast.error("Gagal menolak", { description: err.message }),
  });

  // 5. Cancel
  const cancelMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.patch<{ _id: string; status: StatusOpname }>(
        `/stockopname/${opnameID}/cancel`, 
        {}, 
        undefined, 
        "pengguna"
      );
    },
    onSuccess: () => {
      toast.success("Dibatalkan", { description: "Sesi opname gudang ini telah dibatalkan permanen." });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOpname() });
      setShowCancelModal(false);
    },
    onError: (err: any) => toast.error("Gagal membatalkan", { description: err.message }),
  });

  // --- HANDLERS ---
  const handleItemChange = (itemId: string, field: "qtyPhysical" | "catatanItem", value: string) => {
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleInputPhysical = (itemId: string, value: string) => {
    const raw = value.replace(/[^0-9]/g, ""); // Hanya angka
    handleItemChange(itemId, "qtyPhysical", raw);
  };

  // --- RENDER CONDITIONS ---
  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2947] border-t-transparent"></div>
        <p className="text-sm font-bold text-[#0A2947]/60">Memuat rincian opname gudang...</p>
      </div>
    );
  }

  if (error || !opname) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-[#0A2947]">
        <Ban className="h-10 w-10 text-rose-500" />
        <p className="font-bold">Data stok opname gudang tidak ditemukan atau terjadi kesalahan.</p>
        <Button onClick={() => router.push("/dashboard/gudang/stockOpname")} variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  const isEditable = opname.status === "DRAFT" || opname.status === "REJECTED";
  const isReviewable = opname.status === "SUBMITTED";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
            // PERUBAHAN RUTE KEMBALI
            onClick={() => router.push("/dashboard/gudang/stockOpname")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Opname
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Detail Stok Opname Gudang
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              No. Ref:{" "}
              <span className="font-bold font-mono text-[#0A2947]">
                {opname.nomorOpname}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {badgeStatusOpname(opname.status)}
          
          {/* PERUBAHAN RUTE: Mengarahkan ke Jurnal Stok Gudang */}
          {opname.status === "APPROVED" && (
            <Button
              size="sm"
              className="bg-[#718355] hover:bg-[#718355]/90 text-[#FFFAF3] font-bold shadow-sm"
              onClick={() => router.push("/dashboard/gudang/jurnalStok")}
            >
              <Scale className="w-4 h-4 mr-2" />
              Lihat Jurnal Stok
            </Button>
          )}
        </div>
      </div>

      {/* INFORMASI UMUM & CATATAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <ClipboardCheck className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">
              Informasi Sesi
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-y-5 text-sm">
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai
              </p>
              <p className="font-semibold text-[#0A2947]">
                {formatTanggal(opname.tanggal)}
              </p>
            </div>
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Lokasi / Gudang
              </p>
              <p className="font-semibold text-[#0A2947]">
                {opname.lokasi?.nama || opname.lokasi?.id || "-"}
              </p>
            </div>
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> PIC / Staf
              </p>
              <p className="font-semibold text-[#0A2947]">
                {opname.pic?.nama || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <MessageSquare className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">
              Catatan & Ulasan
            </h2>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <span className="text-xs font-bold text-[#0A2947]/60 block mb-0.5">Catatan Pembuatan:</span>
              <p className="text-sm font-medium text-[#0A2947]/80 italic">
                {opname.catatan || "Tidak ada catatan saat pembuatan draft."}
              </p>
            </div>
            {opname.catatanReview && (
              <div className="p-3 bg-white/50 rounded-xl border border-[#0A2947]/10">
                <span className="text-xs font-bold text-[#0A2947]/60 block mb-1">Pesan dari Kepala Gudang/Reviewer:</span>
                <p className="text-sm font-bold text-[#0A2947]">
                  "{opname.catatanReview}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABEL ITEM OPNAME */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#0A2947]/5 flex items-center justify-between bg-[#FFFAF3]">
          <h2 className="font-bold text-[#0A2947]">Daftar Item & Hasil Perhitungan Gudang</h2>
          
          {isEditable && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveItemsMutation.mutate()}
              disabled={saveItemsMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm"
            >
              {saveItemsMutation.isPending ? "Menyimpan..." : (
                <><Save className="w-4 h-4 mr-2" /> Simpan Angka Sementara</>
              )}
            </Button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FFFAF3] text-[#0A2947]/60 border-b border-[#0A2947]/5 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-4 font-bold">Nama Item Gudang</th>
                <th className="px-5 py-4 font-bold text-center">Stok Sistem</th>
                <th className="px-5 py-4 font-bold text-center w-36">Stok Fisik <span className="text-red-500">*</span></th>
                <th className="px-5 py-4 font-bold text-center">Selisih</th>
                <th className="px-5 py-4 font-bold min-w-50">Catatan / Alasan Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5 bg-[#FFFAF3]">
              {opname.items?.map((item) => {
                const localData = editedItems[item.itemId];
                const displayQtyPhys = isEditable ? (localData?.qtyPhysical ?? "") : (item.qtyPhysical ?? "-");
                
                let diffDisplay: number | string = "-";
                let isMismatch = false;

                if (isEditable && localData?.qtyPhysical !== "") {
                  const phys = Number(localData?.qtyPhysical || 0);
                  diffDisplay = phys - item.qtySystemSnapshot;
                  isMismatch = diffDisplay !== 0;
                } else if (!isEditable && item.qtyPhysical !== null && item.qtyPhysical !== undefined) {
                  diffDisplay = item.qtyPhysical - item.qtySystemSnapshot;
                  isMismatch = diffDisplay !== 0;
                }

                return (
                  <tr key={item.itemId} className="hover:bg-[#0A2947]/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#0A2947]">{item.namaSnapshot}</p>
                      <p className="text-xs text-[#0A2947]/50 font-medium">Satuan: {item.satuanSnapshot}</p>
                    </td>
                    
                    <td className="px-5 py-4 text-center font-bold text-[#0A2947] font-mono bg-[#0A2947]/5">
                      {item.qtySystemSnapshot}
                    </td>
                    
                    <td className="px-5 py-4">
                      {isEditable ? (
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={localData?.qtyPhysical ?? ""}
                          onChange={(e) => handleInputPhysical(item.itemId, e.target.value)}
                          className="w-full text-center font-bold font-mono bg-white border-[#0A2947]/20 focus-visible:ring-[#0A2947]"
                        />
                      ) : (
                        <div className="text-center font-bold text-[#0A2947] font-mono">
                          {displayQtyPhys}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-5 py-4 text-center">
                      <Badge
                        variant="outline"
                        className={`border-none font-bold font-mono px-2 py-0.5 ${
                          diffDisplay === "-"
                            ? "bg-transparent text-[#0A2947]/30"
                            : Number(diffDisplay) > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : Number(diffDisplay) < 0
                            ? "bg-rose-100 text-rose-700"
                            : "bg-[#0A2947]/10 text-[#0A2947]"
                        }`}
                      >
                        {Number(diffDisplay) > 0 ? `+${diffDisplay}` : diffDisplay}
                      </Badge>
                    </td>

                    <td className="px-5 py-3">
                      {isEditable ? (
                        <Input
                          value={localData?.catatanItem ?? ""}
                          onChange={(e) => handleItemChange(item.itemId, "catatanItem", e.target.value)}
                          placeholder="Jika ada selisih, beri alasan..."
                          className={`w-full text-sm bg-white border-[#0A2947]/20 focus-visible:ring-[#0A2947] ${
                            isMismatch && !(localData?.catatanItem) ? "border-rose-300 bg-rose-50 placeholder:text-rose-300" : ""
                          }`}
                        />
                      ) : (
                        <p className="text-sm font-medium text-[#0A2947]/70 italic line-clamp-2">
                          {item.catatanItem || "-"}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {(!opname.items || opname.items.length === 0) && (
                 <tr>
                   <td colSpan={5} className="text-center py-6 text-[#0A2947]/50 font-medium">
                      Tidak ada data item dalam dokumen opname ini.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANEL AKSI FOOTER */}
      
      {isEditable && (
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#0A2947] p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div className="text-[#FFFAF3]">
            <h3 className="font-bold text-sm">Selesai Menghitung Gudang?</h3>
            <p className="text-xs text-[#FFFAF3]/70">Pastikan semua stok fisik sudah diisi. Setelah diajukan, data akan dikunci untuk direview Kepala Gudang.</p>
          </div>
          <Button
            onClick={() => setShowSubmitModal(true)}
            className="cursor-pointer bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 font-bold shadow-sm w-full sm:w-auto"
          >
            <Send className="w-4 h-4 mr-2" /> Ajukan Pengajuan Opname
          </Button>
        </div>
      )}

      {isReviewable && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm flex flex-col gap-4 mt-2">
          <div>
            <h3 className="font-bold text-blue-900 text-base">Tindakan Reviewer (Kepala Gudang)</h3>
            <p className="text-sm text-blue-700/80 font-medium">Periksa selisih yang diajukan. Menyetujui dokumen ini akan merubah stok real-time saat ini.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={() => setShowApproveModal(true)}
              className="cursor-pointer bg-[#718355] text-[#FFFAF3] hover:bg-[#718355]/90 font-bold shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Setujui & Sesuaikan Stok
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(true)}
              className="cursor-pointer border-rose-200 bg-white text-rose-600 hover:bg-rose-50 font-bold shadow-sm"
            >
              <XCircle className="w-4 h-4 mr-2" /> Tolak (Revisi)
            </Button>
            <div className="flex-1"></div>
            <Button
              variant="ghost"
              onClick={() => setShowCancelModal(true)}
              className="cursor-pointer text-[#0A2947]/50 hover:bg-[#0A2947]/5 hover:text-[#0A2947] font-bold"
            >
              Batalkan Sesi Opname
            </Button>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AlertDialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">Kirim Pengajuan Opname?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Pastikan Anda telah menekan tombol <strong className="text-[#0A2947]">Simpan Angka Sementara</strong> sebelum mengajukan. Setelah dikirim, Anda tidak dapat mengubah angka fisik lagi kecuali Kepala Gudang mengembalikannya (Reject).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitMutation.isPending} className="border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending} className="bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold cursor-pointer">
              {submitMutation.isPending ? "Mengajukan..." : "Ya, Kirim Pengajuan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#718355]" /> Setujui Pengajuan
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Menyetujui dokumen ini akan langsung memicu Jurnal Penyesuaian Stok Gudang. Saldo persediaan di sistem akan diubah mengikuti angka fisik yang diinput.
            </AlertDialogDescription>
            <div className="pt-4">
              <label className="text-xs font-bold text-[#0A2947] mb-1.5 block">Catatan Persetujuan (Opsional)</label>
              <Textarea
                placeholder="Misal: Selisih disetujui, sesuai dengan laporan kehilangan."
                value={approveAlasan}
                onChange={(e) => setApproveAlasan(e.target.value)}
                className="bg-white border-[#0A2947]/20 font-medium text-[#0A2947]"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={approveMutation.isPending} className="border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="bg-[#718355] text-[#FFFAF3] hover:bg-[#718355]/90 font-bold cursor-pointer border-none shadow-sm">
              {approveMutation.isPending ? "Memproses Eksekusi..." : "Eksekusi Penyesuaian Stok"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <AlertDialogContent className="bg-[#FFFAF3] border-rose-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-700 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Tolak & Kembalikan ke Staf
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Status opname akan kembali menjadi <strong>REJECTED</strong>. Staf dapat mengedit ulang angka fisik berdasarkan instruksi Anda.
            </AlertDialogDescription>
            <div className="pt-4">
              <label className="text-xs font-bold text-rose-700 mb-1.5 block">Alasan Penolakan <span className="text-rose-500">*</span></label>
              <Textarea
                placeholder="Misal: Harap hitung ulang bagian rak belakang."
                value={rejectCatatan}
                onChange={(e) => setRejectCatatan(e.target.value)}
                className="bg-white border-rose-200 focus-visible:ring-rose-500 font-medium text-[#0A2947]"
              />
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel disabled={rejectMutation.isPending} className="border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => rejectMutation.mutate()} 
              disabled={rejectMutation.isPending || rejectCatatan.trim().length === 0} 
              className="bg-rose-600 text-[#FFFAF3] hover:bg-rose-700 font-bold cursor-pointer border-none shadow-sm"
            >
              {rejectMutation.isPending ? "Memproses..." : "Tolak Pengajuan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947] flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-500" /> Batalkan Sesi Opname?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Tindakan ini akan membatalkan sesi perhitungan stok secara permanen. Anda tidak dapat melanjutkan proses ini lagi. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending} className="border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold cursor-pointer">Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="bg-rose-600 text-[#FFFAF3] hover:bg-rose-700 font-bold cursor-pointer border-none shadow-sm">
              {cancelMutation.isPending ? "Membatalkan..." : "Ya, Batalkan Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}