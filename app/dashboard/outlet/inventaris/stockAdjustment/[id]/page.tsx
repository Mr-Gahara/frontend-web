"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { StockAdjustment } from "@/types/stockOpname";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Scale,
  Calendar,
  MapPin,
  User,
  FileText,
  Ban,
  ArchiveRestore,
} from "lucide-react";

// --- HELPERS ---
const formatTanggal = (iso: string | null | undefined) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

export default function StockAdjustmentDetailPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const adjustmentID = params.id as string;

  // --- FETCH DATA ADJUSTMENT ---
  const {
    data: adjustment,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.stockAdjustmentDetail(adjustmentID as string),
    queryFn: async () => {
      // FIX 1: Endpoint yang benar berdasarkan router backend Anda
      const res = await apiClient.get<any>(
        `/stockopname/adjustments/${adjustmentID}`,
        undefined,
        "pengguna",
      );
      return (res.data?.data || res.data) as StockAdjustment;
    },
    enabled: !!adjustmentID,
  });

  // --- RENDER CONDITIONS ---
  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2947] border-t-transparent"></div>
        <p className="text-sm font-bold text-[#0A2947]/60">
          Memuat audit trail...
        </p>
      </div>
    );
  }

  if (error || !adjustment) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-[#0A2947]">
        <Ban className="h-10 w-10 text-rose-500" />
        <p className="font-bold">
          Jurnal Penyesuaian tidak ditemukan atau terjadi kesalahan server.
        </p>
        <Button
          onClick={() => router.push("/dashboard/outlet/inventaris/stockAdjustment")}
          variant="outline"
        >
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

  // Fallback untuk referensi tipe jika kosong
  const refTypeLabel = (
    adjustment.nomorAdjustment || "MANUAL_CORRECTION"
  ).replace(/_/g, " ");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
            onClick={() => router.push("/dashboard/outlet/inventaris/stockAdjustment")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Daftar Jurnal
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Detail Jurnal Penyesuaian
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              No. Ref:{" "}
              <span className="font-bold font-mono text-[#0A2947]">
                {adjustment.nomorAdjustment}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0">
          <Badge className="bg-[#718355] text-[#FFFAF3] px-3 py-1 font-bold border-none shadow-sm text-xs">
            Selesai
          </Badge>
        </div>
      </div>

      {/* INFORMASI UMUM (READ-ONLY) */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 shadow-sm flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-5">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <ArchiveRestore className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">Audit Trail Informasi</h2>
          </div>

          <div className="grid grid-cols-2 gap-y-5 text-sm">
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Eksekusi
              </p>
              <p className="font-semibold text-[#0A2947]">
                {formatTanggal(adjustment.tanggal)}
              </p>
            </div>
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Lokasi / Gudang
              </p>
              <p className="font-semibold text-[#0A2947]">
                {adjustment.lokasi?.nama || adjustment.lokasi?.id || "-"}
              </p>
            </div>
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Dieksekusi Oleh
              </p>
              <p className="font-semibold text-[#0A2947]">
                {adjustment.pic?.nama || "-"}
              </p>
            </div>
            <div>
              <p className="text-[#0A2947]/60 font-bold text-xs mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5" /> Sumber Dokumen
              </p>
              <p className="font-bold text-[#D4A373]">{refTypeLabel}</p>
            </div>
          </div>
        </div>

        {/* FIX UI: Ubah ke flex-col dan flex-1 untuk mencegah overflow */}
        <div className="flex-1 flex flex-col gap-3 md:border-l border-[#0A2947]/10 md:pl-8">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <FileText className="h-5 w-5 text-[#D4A373]" />
            <h2 className="font-bold text-[#0A2947]">Alasan Penyesuaian</h2>
          </div>
          <div className="flex-1 p-4 bg-white/60 rounded-xl border border-[#0A2947]/5 min-h-25">
            <p className="text-sm font-bold text-[#0A2947]/40 italic leading-relaxed">
              "{adjustment.catatan || "Tidak ada alasan spesifik yang dicantumkan."}"
            </p>
          </div>
        </div>
      </div>

      {/* TABEL ITEM MUTASI */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#FFFAF3] shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#0A2947]/5 flex items-center justify-between bg-[#FFFAF3]">
          <h2 className="font-bold text-[#0A2947]">
            Rekapitulasi Perubahan Saldo Fisik
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F2EAE1] text-[#0A2947]/60 border-b border-[#0A2947]/10 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-4 font-bold">Nama Item</th>
                <th className="px-5 py-4 font-bold text-center">
                  Saldo Sistem (Awal)
                </th>
                <th className="px-5 py-4 font-bold text-center">Fisik Riil</th>
                <th className="px-5 py-4 font-bold text-center">
                  Koreksi (Delta)
                </th>
                <th className="px-5 py-4 font-bold min-w-50">Catatan Ekstra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5">
              {adjustment.items?.map((item) => {
                // FIX 2: Silent Bypass untuk Backend Mapper Bug.
                // Jika qtySebelum/Adjustment bernilai 0 atau tidak ada, kita paksa baca dari raw Schema Property.
                const qtySistem =
                  item.qtySebelum || (item as any).qtyCurrent || 0;
                const qtyKoreksi =
                  item.qtyAdjustment || (item as any).qtyDifference || 0;
                const qtyFisik = item.qtyPhysical ?? 0;

                const isPlus = qtyKoreksi > 0;
                const isMinus = qtyKoreksi < 0;

                return (
                  <tr
                    key={item.itemId}
                    className="hover:bg-[#0A2947]/5 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#0A2947]">
                        {item.namaSnapshot}
                      </p>
                      <p className="text-xs text-[#0A2947]/50 font-medium">
                        Satuan: {item.satuanSnapshot}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-center font-bold text-[#0A2947]/60 font-mono">
                      {qtySistem}
                    </td>

                    <td className="px-5 py-4 text-center font-bold text-[#0A2947] font-mono bg-[#0A2947]/5">
                      {qtyFisik}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <Badge
                        variant="outline"
                        className={`border-none font-bold font-mono px-2 py-0.5 ${
                          qtyKoreksi === 0
                            ? "bg-[#0A2947]/10 text-[#0A2947]"
                            : isPlus
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {isPlus ? `+${qtyKoreksi}` : qtyKoreksi}
                      </Badge>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-[#0A2947]/70 italic line-clamp-2">
                      {item.catatanItem || "-"}
                    </td>
                  </tr>
                );
              })}

              {(!adjustment.items || adjustment.items.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-8 text-[#0A2947]/50 font-medium"
                  >
                    Tidak ada detail item yang direkam dalam jurnal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
