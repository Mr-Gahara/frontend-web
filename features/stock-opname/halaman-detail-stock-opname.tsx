"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StockOpname, StatusOpname } from "@/types/stockOpname";
import { toast } from "sonner";
import { isNotFound, pesanError } from "@/lib/api/error";
import { useSession } from "@/lib/auth/useSession";
import {
  useAjukanOpname,
  useBatalkanOpname,
  useSetujuiOpname,
  useSimpanHitungan,
  useStockOpname,
  useTolakOpname,
} from "./hooks";
import { isiAwalHitungan, petakanNilaiServer, susunPayloadHitungan } from "./payload";
import { bolehHitungOpname, bolehTinjauOpname } from "./izin";
import { TIPE_LOKASI_RUANG } from "@/features/stock-adjustment/ruang";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DialogAksiOpname } from "./dialog-aksi-opname";
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
    DRAFT: "bg-karamel text-navy",
    SUBMITTED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-sage text-gading",
    REJECTED: "bg-rose-100 text-rose-700",
    CANCELLED: "bg-navy/10 text-navy/60",
  };
  
  const labels: Record<StatusOpname, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Menunggu Review",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
  };

  const className = map[status] || "bg-navy/5 text-navy/60";
  return (
    <Badge className={`${className} px-3 py-1 font-bold border-none shadow-sm text-xs`}>
      {labels[status] || status}
    </Badge>
  );
};

interface TeksRuang {
  judul: string;
  urlDaftar: string;
  namaJurnal: string;
  deskripsiAjukan: string;
  deskripsiBatal: string;
  alasanSetujuiBawaan: string;
  tombolSetelahSetuju: string;
  tautanSetelahSetuju: (opname: StockOpname) => string | null;
}

const TEKS: Record<"outlet" | "gudang", TeksRuang> = {
  outlet: {
    judul: "Detail Stok Opname",
    urlDaftar: "/dashboard/outlet/inventaris/stockOpname",
    namaJurnal: "Jurnal Penyesuaian Stok",
    deskripsiAjukan: "Sesi opname telah dikunci dan diajukan ke manajer.",
    deskripsiBatal: "Sesi opname ini telah dibatalkan permanen.",
    alasanSetujuiBawaan: "Disetujui oleh manajer",
    tombolSetelahSetuju: "Lihat Jurnal Penyesuaian",
    tautanSetelahSetuju: (opname) =>
      opname.stockAdjustment?.id
        ? `/dashboard/outlet/inventaris/stockAdjustment/${opname.stockAdjustment.id}`
        : null,
  },
  gudang: {
    judul: "Detail Stok Opname Gudang",
    urlDaftar: "/dashboard/gudang/stockOpname",
    namaJurnal: "Jurnal Penyesuaian Stok Gudang",
    deskripsiAjukan: "Sesi opname telah dikunci dan diajukan ke Kepala Gudang.",
    deskripsiBatal: "Sesi opname gudang ini telah dibatalkan permanen.",
    alasanSetujuiBawaan: "Disetujui oleh manajemen gudang",
    tombolSetelahSetuju: "Lihat Jurnal Penyesuaian",
    tautanSetelahSetuju: (opname) =>
      opname.stockAdjustment?.id
        ? `/dashboard/gudang/stockAdjustment/${opname.stockAdjustment.id}`
        : null,
  },
};

interface Props {
  ruang: keyof typeof TEKS;
}

export default function HalamanDetailStockOpname({ ruang }: Props) {
  const router = useRouter();
  const params = useParams();
  const opnameID = params.id as string;
  const teks = TEKS[ruang];
  const { permissions } = useSession();
  const bolehHitung = bolehHitungOpname(permissions ?? []);
  const bolehTinjau = bolehTinjauOpname(permissions ?? []);

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
  const { data: opname, isLoading, error } = useStockOpname(opnameID);

  // Isian hitungan diisi ulang dari server setiap kali data opname berganti
  // (dimuat, disimpan sementara, atau ditolak) selagi DRAFT atau REJECTED.
  // Disesuaikan saat render, bukan di effect (react-hooks/set-state-in-effect).
  // Nilai awal undefined agar data yang sudah ada di cache saat halaman dibuka
  // tetap mengisi. TanStack mempertahankan referensi data yang tidak berubah,
  // sehingga pengisian ulang hanya terjadi saat data server benar-benar berubah.
  const [opnameTerisi, setOpnameTerisi] = useState<StockOpname | undefined>(undefined);
  if (opname !== opnameTerisi) {
    setOpnameTerisi(opname);
    if (opname && (opname.status === "DRAFT" || opname.status === "REJECTED")) {
      setEditedItems(isiAwalHitungan(opname.items ?? []));
    }
  }

  // --- MUTATIONS ---
  // Dialog ditutup hanya saat berhasil; saat gagal tetap terbuka beserta
  // isiannya (keputusan Fase 0).
  const saveItemsMutation = useSimpanHitungan(opnameID, {
    onSuccess: () =>
      toast.success("Tersimpan", { description: "Input stok fisik berhasil disimpan sementara." }),
    onError: (err) =>
      toast.error("Gagal menyimpan", { description: pesanError(err, "Gagal menyimpan stok fisik.") }),
  });

  const simpanHitungan = () => {
    const payload = susunPayloadHitungan(editedItems, petakanNilaiServer(opname?.items ?? []));
    if (payload.items.length === 0) {
      toast.info("Tidak ada perubahan", {
        description: "Tidak ada perubahan untuk disimpan.",
      });
      return;
    }
    saveItemsMutation.mutate(payload);
  };

  const submitMutation = useAjukanOpname(opnameID, {
    onSuccess: () => {
      toast.success("Berhasil Diajukan", { description: teks.deskripsiAjukan });
      setShowSubmitModal(false);
    },
    onError: (err) =>
      toast.error("Gagal mengajukan", { description: pesanError(err, "Gagal mengajukan opname.") }),
  });

  const approveMutation = useSetujuiOpname(opnameID, {
    onSuccess: () => {
      toast.success("Opname Disetujui", {
        description: "Penyesuaian stok berhasil dieksekusi oleh sistem.",
      });
      setShowApproveModal(false);
    },
    onError: (err) =>
      toast.error("Gagal menyetujui", { description: pesanError(err, "Gagal menyetujui opname.") }),
  });

  const rejectMutation = useTolakOpname(opnameID, {
    onSuccess: () => {
      toast.success("Opname Ditolak", { description: "Sesi dikembalikan ke staf untuk direvisi." });
      setShowRejectModal(false);
      setRejectCatatan("");
    },
    onError: (err) =>
      toast.error("Gagal menolak", { description: pesanError(err, "Gagal menolak opname.") }),
  });

  const cancelMutation = useBatalkanOpname(opnameID, {
    onSuccess: () => {
      toast.success("Dibatalkan", { description: teks.deskripsiBatal });
      setShowCancelModal(false);
    },
    onError: (err) =>
      toast.error("Gagal membatalkan", { description: pesanError(err, "Gagal membatalkan opname.") }),
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent"></div>
        <p className="text-sm font-bold text-navy/60">Memuat rincian opname...</p>
      </div>
    );
  }

  if (error || !opname) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-navy">
        <Ban className="h-10 w-10 text-rose-500" />
        <p className="font-bold">
          {!error || isNotFound(error)
            ? "Dokumen stok opname tidak ditemukan."
            : "Gagal memuat dokumen stok opname. Coba muat ulang halaman."}
        </p>
        <Button onClick={() => router.push(teks.urlDaftar)} variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // Dokumen milik ruang lain tidak ditampilkan: stok outlet dan gudang tidak
  // dicampur (keputusan Model bisnis MVP). Ini penjaga tampilan, bukan
  // pengaman akses; dokumen yang tipe lokasinya tidak diketahui tetap tampil.
  const tipeLokasi = opname.lokasi?.tipe;
  if (tipeLokasi && tipeLokasi !== TIPE_LOKASI_RUANG[ruang]) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-navy">
        <Ban className="h-10 w-10 text-rose-500" />
        <p className="font-bold">
          Dokumen stok opname ini milik lokasi {tipeLokasi} dan tidak ditampilkan di ruang ini.
        </p>
        <Button onClick={() => router.push(teks.urlDaftar)} variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // Status menentukan tahap dokumen; izin menentukan siapa yang boleh bertindak
  // (submit-stock-opname untuk menghitung, review-stock-opname untuk meninjau).
  const statusTerbuka = opname.status === "DRAFT" || opname.status === "REJECTED";
  const isEditable = statusTerbuka && bolehHitung;
  const isReviewable = opname.status === "SUBMITTED" && bolehTinjau;
  const bisaBatalTerbuka = statusTerbuka && bolehTinjau;
  const tautanSetuju = teks.tautanSetelahSetuju(opname);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-navy/60 hover:bg-transparent hover:text-navy font-semibold transition-colors"
            onClick={() => router.push(teks.urlDaftar)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Opname
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              {teks.judul}
            </h1>
            <p className="text-sm font-medium text-navy/60">
              No. Ref:{" "}
              <span className="font-bold font-mono text-navy">
                {opname.nomorOpname}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {badgeStatusOpname(opname.status)}
          
          {/* Outlet menuju detail adjustment; gudang menuju jurnal stok gudang. */}
          {opname.status === "APPROVED" && tautanSetuju && (
            <Button
              size="sm"
              className="bg-sage hover:bg-sage/90 text-gading font-bold shadow-sm"
              onClick={() => router.push(tautanSetuju)}
            >
              <Scale className="w-4 h-4 mr-2" />
              {teks.tombolSetelahSetuju}
            </Button>
          )}
        </div>
      </div>

      {/* INFORMASI UMUM & CATATAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-navy/10 pb-3">
            <ClipboardCheck className="h-5 w-5 text-karamel" />
            <h2 className="font-bold text-navy">
              Informasi Sesi
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-y-5 text-sm">
            <div>
              <p className="text-navy/60 font-bold text-xs mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai
              </p>
              <p className="font-semibold text-navy">
                {formatTanggal(opname.tanggal)}
              </p>
            </div>
            <div>
              <p className="text-navy/60 font-bold text-xs mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Lokasi / Gudang
              </p>
              {/* FIX: Ambil dari relasi lokasi */}
              <p className="font-semibold text-navy">
                {opname.lokasi?.nama || opname.lokasi?.id || "-"}
              </p>
            </div>
            <div>
              <p className="text-navy/60 font-bold text-xs mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> PIC / Staf
              </p>
              {/* FIX: Ambil dari relasi pic */}
              <p className="font-semibold text-navy">
                {opname.pic?.nama || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-navy/10 bg-krem p-6 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-2 border-b border-navy/10 pb-3">
            <MessageSquare className="h-5 w-5 text-karamel" />
            <h2 className="font-bold text-navy">
              Catatan & Ulasan
            </h2>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <span className="text-xs font-bold text-navy/60 block mb-0.5">Catatan Pembuatan:</span>
              <p className="text-sm font-medium text-navy/80 italic">
                {opname.catatan || "Tidak ada catatan saat pembuatan draft."}
              </p>
            </div>
            {opname.catatanReview && (
              <div className="p-3 bg-white/50 rounded-xl border border-navy/10">
                <span className="text-xs font-bold text-navy/60 block mb-1">Pesan dari Manajer/Reviewer:</span>
                <p className="text-sm font-bold text-navy">
                  &ldquo;{opname.catatanReview}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABEL ITEM OPNAME */}
      <div className="rounded-2xl border border-navy/10 bg-krem shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-navy/5 flex items-center justify-between bg-gading">
          <h2 className="font-bold text-navy">Daftar Item & Hasil Perhitungan</h2>
          
          {/* Tombol Simpan Draft khusus Staf (Jika DRAFT/REJECTED) */}
          {isEditable && (
            <Button
              size="sm"
              variant="outline"
              onClick={simpanHitungan}
              disabled={saveItemsMutation.isPending}
              className="cursor-pointer border-navy/20 text-navy hover:bg-navy/5 font-bold shadow-sm"
            >
              {saveItemsMutation.isPending ? "Menyimpan..." : (
                <><Save className="w-4 h-4 mr-2" /> Simpan Angka Sementara</>
              )}
            </Button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gading text-navy/60 border-b border-navy/5 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-4 font-bold">Nama Item</th>
                <th className="px-5 py-4 font-bold text-center">Stok Sistem</th>
                <th className="px-5 py-4 font-bold text-center w-36">Stok Fisik <span className="text-red-500">*</span></th>
                <th className="px-5 py-4 font-bold text-center">Selisih</th>
                <th className="px-5 py-4 font-bold min-w-50">Catatan / Alasan Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy/5 bg-gading">
              {/* FIX: Tambahkan optional chaining pada opname.items */}
              {opname.items?.map((item) => {
                // Menentukan display value untuk stok fisik
                const localData = editedItems[item.itemId];
                const displayQtyPhys = isEditable ? (localData?.qtyPhysical ?? "") : (item.qtyPhysical ?? "-");
                
                // Menghitung selisih real-time saat edit
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
                  <tr key={item.itemId} className="hover:bg-navy/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-navy">{item.namaSnapshot}</p>
                      <p className="text-xs text-navy/50 font-medium">Satuan: {item.satuanSnapshot}</p>
                    </td>
                    
                    <td className="px-5 py-4 text-center font-bold text-navy font-mono bg-navy/5">
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
                          className="w-full text-center font-bold font-mono bg-white border-navy/20 focus-visible:ring-navy"
                        />
                      ) : (
                        <div className="text-center font-bold text-navy font-mono">
                          {displayQtyPhys}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-5 py-4 text-center">
                      <Badge
                        variant="outline"
                        className={`border-none font-bold font-mono px-2 py-0.5 ${
                          diffDisplay === "-"
                            ? "bg-transparent text-navy/30"
                            : Number(diffDisplay) > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : Number(diffDisplay) < 0
                            ? "bg-rose-100 text-rose-700"
                            : "bg-navy/10 text-navy"
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
                          className={`w-full text-sm bg-white border-navy/20 focus-visible:ring-navy ${
                            isMismatch && !(localData?.catatanItem) ? "border-rose-300 bg-rose-50 placeholder:text-rose-300" : ""
                          }`}
                        />
                      ) : (
                        <p className="text-sm font-medium text-navy/70 italic line-clamp-2">
                          {item.catatanItem || "-"}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {/* Fallback Jika tidak ada item */}
              {(!opname.items || opname.items.length === 0) && (
                 <tr>
                   <td colSpan={5} className="text-center py-6 text-navy/50 font-medium">
                      Tidak ada data item dalam dokumen opname ini.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANEL AKSI FOOTER (Dinamis berdasarkan status) */}
      
      {/* 1. AKSI STAF: SUBMIT */}
      {isEditable && (
        <div className="rounded-2xl border border-navy/10 bg-navy p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div className="text-gading">
            <h3 className="font-bold text-sm">Selesai Menghitung?</h3>
            <p className="text-xs text-gading/70">Pastikan semua stok fisik sudah diisi. Setelah diajukan, data akan dikunci untuk direview Manajer.</p>
          </div>
          <Button
            onClick={() => setShowSubmitModal(true)}
            className="cursor-pointer bg-karamel text-navy hover:bg-karamel/90 font-bold shadow-sm w-full sm:w-auto"
          >
            <Send className="w-4 h-4 mr-2" /> Ajukan Pengajuan Opname
          </Button>
        </div>
      )}

      {/* Dokumen DRAFT atau REJECTED juga dapat dibatalkan peninjau; backend mengizinkannya. */}
      {bisaBatalTerbuka && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => setShowCancelModal(true)}
            className="cursor-pointer text-navy/50 hover:bg-navy/5 hover:text-navy font-bold"
          >
            Batalkan Sesi Opname
          </Button>
        </div>
      )}

      {/* 2. AKSI MANAJER: REVIEW (APPROVE / REJECT / CANCEL) */}
      {isReviewable && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm flex flex-col gap-4 mt-2">
          <div>
            <h3 className="font-bold text-blue-900 text-base">Tindakan Reviewer (Manajer)</h3>
            <p className="text-sm text-blue-700/80 font-medium">Periksa selisih yang diajukan. Menyetujui dokumen ini akan merubah stok real-time saat ini.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={() => setShowApproveModal(true)}
              className="cursor-pointer bg-sage text-gading hover:bg-sage/90 font-bold shadow-sm"
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
              className="cursor-pointer text-navy/50 hover:bg-navy/5 hover:text-navy font-bold"
            >
              Batalkan Sesi Opname
            </Button>
          </div>
        </div>
      )}

      <DialogAksiOpname
        ajukan={{ open: showSubmitModal, onOpenChange: setShowSubmitModal, pending: submitMutation.isPending, onKonfirmasi: () => submitMutation.mutate() }}
        setujui={{
          open: showApproveModal,
          onOpenChange: setShowApproveModal,
          pending: approveMutation.isPending,
          namaJurnal: teks.namaJurnal,
          alasan: approveAlasan,
          onAlasan: setApproveAlasan,
          onKonfirmasi: () => approveMutation.mutate(approveAlasan.trim() || teks.alasanSetujuiBawaan),
        }}
        tolak={{
          open: showRejectModal,
          onOpenChange: setShowRejectModal,
          pending: rejectMutation.isPending,
          catatan: rejectCatatan,
          onCatatan: setRejectCatatan,
          onKonfirmasi: () => rejectMutation.mutate(rejectCatatan.trim()),
        }}
        batal={{ open: showCancelModal, onOpenChange: setShowCancelModal, pending: cancelMutation.isPending, onKonfirmasi: () => cancelMutation.mutate() }}
      />
    </div>
  );
}