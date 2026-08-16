"use client";

import { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TransferStok } from "@/types/transferStok";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  PackageCheck,
  Truck,
  CalendarClock,
  MapPin,
  AlertTriangle,
  ClipboardCheck,
  Check,
  MessageSquareWarning,
} from "lucide-react";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

// --- Types Khusus Halaman Ini ---
type FormItem = {
  _id: string;
  bahanBakuID: any;
  qtyKirim: number;
  qtyTerima: number;
  catatanItem: string;
};

export default function EksekusiPenerimaanBarangPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = use(params);

  // --- Form State ---
  const [items, setItems] = useState<FormItem[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- Queries ---
  const { data: detail, isLoading } = useQuery({
    queryKey: [...queryKeys.transferStok(), "detail", id],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/transferStok/${id}`,
        undefined,
        "pengguna",
      );
      return (res.data?.data || res.data) as TransferStok;
    },
  });

  // --- Initialize Form Data ---
  useEffect(() => {
    if (detail?.items && detail.status === "DIKIRIM") {
      setItems(
        detail.items.map((item: any) => {
          // Fallback cerdas: Jika crypto diblokir browser (karena HTTP), gunakan Math.random
          const safeId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" 
            ? crypto.randomUUID() 
            : `temp-${Math.random().toString(36).substring(2, 11)}`;

          return {
            _id: item._id || safeId,
            bahanBakuID: item.bahanBakuID,
            qtyKirim: item.qtyKirim,
            qtyTerima: item.qtyKirim, // Default: Anggap semua barang utuh
            catatanItem: item.catatanItem || "",
          };
        })
      );
    }
  }, [detail]);


  // --- Handlers ---
  const handleQtyChange = (itemId: string, value: string) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i._id === itemId) {
          let val = Number(value);
          if (val < 0) val = 0;
          if (val > i.qtyKirim) val = i.qtyKirim; // Tidak boleh terima lebih dari yang dikirim
          return { ...i, qtyTerima: val };
        }
        return i;
      }),
    );
  };

  const handleNoteChange = (itemId: string, note: string) => {
    setItems((prev) =>
      prev.map((i) => (i._id === itemId ? { ...i, catatanItem: note } : i)),
    );
  };

  // --- Validasi ---
  // Memastikan bahwa setiap barang yang jumlah diterimanya KURANG, wajib diisi catatannya.
  const isFormValid = useMemo(() => {
    for (const item of items) {
      if (item.qtyTerima < item.qtyKirim && item.catatanItem.trim() === "") {
        return false;
      }
    }
    return true;
  }, [items]);

  const hasSelisih = items.some((i) => i.qtyTerima < i.qtyKirim);

  // --- Mutations ---
  const terimaMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        status: "DITERIMA",
        items: items
          .filter((i) => i.bahanBakuID) // FIX: Buang "Barang Hantu" yang master datanya sudah dihapus agar backend tidak crash
          .map((i) => ({
            bahanBakuID: i.bahanBakuID?._id || i.bahanBakuID?.id || (typeof i.bahanBakuID === "string" ? i.bahanBakuID : ""),
            qtyKirim: i.qtyKirim,
            qtyTerima: i.qtyTerima,
            catatanItem: i.catatanItem,
          })),


        tanggalTerima: new Date().toISOString(),
      };

      return await apiClient.patch(
        `/transferStok/${id}/terima`,
        payload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Barang Berhasil Diterima", {
        description:
          "Stok Outlet telah diperbarui dan Jurnal Stok telah dicatat.",
      });
      // Invalidate semua data terkait WMS
      queryClient.invalidateQueries({ queryKey: queryKeys.transferStok() });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["jurnalStok"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.pengajuanStok() });

      router.push("/dashboard/outlet/inventaris/penerimaanBarang");
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses Penerimaan", { description: err.message });
      setShowConfirmModal(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64 bg-[#0A2947]/10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full lg:col-span-2 bg-[#0A2947]/10 rounded-2xl" />
          <Skeleton className="h-72 w-full lg:col-span-1 bg-[#0A2947]/10 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-rose-500/50" />
        <h2 className="text-xl font-bold text-[#0A2947]">
          Surat Jalan Tidak Ditemukan
        </h2>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="cursor-pointer"
        >
          Kembali
        </Button>
      </div>
    );
  }

  // Tembok Keamanan: Jika sudah diterima, blokir formnya.
  if (detail.status !== "DIKIRIM") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 max-w-lg mx-auto text-center">
        <div className="p-4 bg-blue-50 rounded-full border border-blue-100">
          <ClipboardCheck className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-[#0A2947]">
          Pengiriman Sudah Selesai
        </h2>
        <p className="text-sm font-medium text-[#0A2947]/60">
          Surat Jalan ini berstatus{" "}
          <strong className="text-[#0A2947]">{detail.status}</strong> dan barang
          sudah dieksekusi masuk ke dalam stok kasir Anda.
        </p>
        <Button
          variant="default"
          className="bg-[#0A2947] cursor-pointer mt-4"
          onClick={() =>
            router.push("/dashboard/outlet/inventaris/penerimaanBarang")
          }
        >
          Kembali ke Daftar Inbound
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-6xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Batal & Kembali
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-black font-mono tracking-tight text-[#0A2947]">
            {detail.nomorTransfer}
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60 flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            Pengiriman Logistik dari {detail.dariLokasi?.nama || "Pusat"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* KOLOM KIRI: DAFTAR PERIKSA FISIK (CHECKLIST) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[#0A2947]/10 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="bg-[#F2EAE1] px-6 py-4 border-b border-[#0A2947]/10 flex flex-col gap-1">
              <h2 className="font-bold text-[#0A2947] flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-700" />
                Daftar Periksa Fisik Barang
              </h2>
              <p className="text-[11px] font-medium text-[#0A2947]/60 pl-7">
                Hitung fisik barang dan sesuaikan jumlah yang diterima. Jika ada
                selisih, wajib mengisi alasan.
              </p>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {items.map((item, index) => {
                const isSelisih = item.qtyTerima < item.qtyKirim;
                return (
                  <div
                    key={item._id}
                    className="flex flex-col gap-3 p-4 rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] shadow-sm relative overflow-hidden transition-all"
                  >
                    {/* Indikator Selisih */}
                    {isSelisih && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Info Barang */}
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-[#0A2947]/40 uppercase tracking-wider block mb-0.5">
                          Item #{index + 1}
                        </span>
                        <h3 className="font-bold text-[#0A2947] text-base leading-tight">
                          {item.bahanBakuID?.namaBahan ||
                            "Master Data Terhapus"}
                        </h3>
                        <p className="text-xs font-medium text-[#0A2947]/50 mt-1">
                          Dikirim Gudang:{" "}
                          <strong className="text-[#0A2947]">
                            {item.qtyKirim} {item.bahanBakuID?.satuan}
                          </strong>
                        </p>
                      </div>

                      {/* Input Qty Terima */}
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-bold text-emerald-700 uppercase block mb-1 text-right">
                            Fisik Diterima
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={
                                item.qtyTerima === 0 &&
                                item.qtyKirim > 0 &&
                                !isSelisih
                                  ? ""
                                  : item.qtyTerima
                              } // Biar enak ngetik 0
                              onChange={(e) =>
                                handleQtyChange(item._id, e.target.value)
                              }
                              className={cn(
                                "w-24 text-center font-mono font-bold text-lg h-10 no-spinner focus-visible:ring-1",
                                isSelisih
                                  ? "border-rose-300 bg-rose-50 text-rose-700 focus-visible:ring-rose-500"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 focus-visible:ring-emerald-600",
                              )}
                            />
                            <span className="text-sm font-bold text-[#0A2947]/50 shrink-0 w-8">
                              {item.bahanBakuID?.satuan}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Input Alasan (Hanya muncul jika ada selisih) */}
                    {isSelisih && (
                      <div className="pt-3 border-t border-rose-100 mt-1">
                        <label className="text-[11px] font-bold text-rose-600 uppercase flex items-center gap-1 mb-1.5">
                          <MessageSquareWarning className="w-3.5 h-3.5" />{" "}
                          Alasan Selisih Barang{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="Misal: 1 bungkus pecah, 2 pcs hilang di jalan..."
                          value={item.catatanItem}
                          onChange={(e) =>
                            handleNoteChange(item._id, e.target.value)
                          }
                          className={cn(
                            "bg-white border-rose-200 text-[#0A2947] h-10 placeholder:text-rose-300",
                            item.catatanItem.trim() === ""
                              ? "focus-visible:ring-rose-500 ring-1 ring-rose-300"
                              : "focus-visible:ring-emerald-500",
                          )}
                        />
                        {item.catatanItem.trim() === "" && (
                          <p className="text-[10px] text-rose-500 mt-1.5 font-bold">
                            Wajib diisi karena jumlah terima kurang dari yang
                            dikirim.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: RINGKASAN & EKSEKUSI */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-[#0A2947]/10 bg-white p-6 shadow-sm space-y-5">
            <h2 className="font-bold text-[#0A2947] flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <MapPin className="w-4 h-4 text-[#D4A373]" /> Info Logistik
            </h2>

            <div className="space-y-3 pt-1">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase">
                  Asal Barang
                </span>
                <span className="font-bold text-[#0A2947]">
                  {detail.dariLokasi?.nama || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase">
                  Tujuan
                </span>
                <span className="font-bold text-[#0A2947]">
                  {detail.keLokasi?.nama || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase">
                  Waktu Berangkat
                </span>
                <span className="font-bold text-[#0A2947] flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />{" "}
                  {formatTanggal(detail.tanggalKirim)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase">
                  PIC Pengirim
                </span>
                <span className="font-bold text-[#0A2947] capitalize">
                  {detail.pengirim?.nama || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm flex flex-col gap-3">
            <h3 className="text-sm font-bold text-emerald-900 text-center mb-1">
              Finalisasi Kedatangan
            </h3>

            {!isFormValid && (
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl mb-2 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-rose-700 leading-snug">
                  Mohon isi alasan untuk semua barang yang jumlah diterimanya
                  tidak utuh.
                </p>
              </div>
            )}

            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={!isFormValid || terimaMutation.isPending}
              className={cn(
                "w-full h-12 text-base font-bold shadow-md cursor-pointer transition-colors",
                !isFormValid
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300"
                  : "bg-emerald-600 text-white hover:bg-emerald-700",
              )}
            >
              <Check className="w-5 h-5 mr-2" /> Konfirmasi Terima Barang
            </Button>
            <p className="text-[10px] font-medium text-emerald-800/60 text-center mt-1 leading-tight">
              Aksi ini akan menyuntikkan fisik barang secara otomatis ke dalam
              stok POS/Toko Anda.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent className="bg-[#FFFAF3] border-[#0A2947]/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#0A2947]">
              Selesaikan Inbound & Update Stok?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A2947]/70 font-medium">
              Sistem akan memproses dokumen Surat Jalan{" "}
              <strong className="text-[#0A2947]">{detail.nomorTransfer}</strong>{" "}
              dan langsung menambahkan barang ke dalam pembukuan inventaris
              Outlet Anda. Pastikan jumlah fisik sudah benar.
              {hasSelisih && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-medium">
                  <strong>Catatan:</strong> Terdapat selisih kurang pada
                  beberapa item. Data akan otomatis disesuaikan dan
                  dipertanggungjawabkan di Jurnal Stok.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={terimaMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => terimaMutation.mutate()}
              disabled={terimaMutation.isPending}
              className="cursor-pointer bg-emerald-600 text-[#FFFAF3] hover:bg-emerald-700 font-bold border-none"
            >
              {terimaMutation.isPending
                ? "Mengeksekusi Data..."
                : "Ya, Selesaikan Inbound"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
