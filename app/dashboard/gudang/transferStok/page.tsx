"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { useDebounce } from "@/hooks/use-debounce";
// Asumsi: Anda sudah membuat type ini di types/transferStok.ts
import { TransferStok, StatusTransfer } from "@/types/transferStok";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  PackageSearch,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Truck,
  Send,
} from "lucide-react";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const getStatusBadge = (status: StatusTransfer) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-300 border-none font-bold">
          <Clock className="w-3 h-3 mr-1" /> Draft SJ
        </Badge>
      );
    case "DIKIRIM":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold">
          <Send className="w-3 h-3 mr-1" /> Sedang Dikirim
        </Badge>
      );
    case "DITERIMA":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
        </Badge>
      );
    case "BATAL":
      return (
        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none font-bold">
          <XCircle className="w-3 h-3 mr-1" /> Dibatalkan
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function TransferStokGudangPage() {
  const router = useRouter();

  // --- States ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [activeTab, setActiveTab] = useState<StatusTransfer | "ALL">("ALL");

  // --- Queries ---
  const { data: daftarTransfer = [], isLoading } = useQuery({
    queryKey: queryKeys.transferStok({
      status: activeTab !== "ALL" ? activeTab : undefined,
    }),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (activeTab !== "ALL") params.status = activeTab;

      const res = await apiClient.get<any>("/transferStok", params, "pengguna");
      return (res.data?.data || res.data || []) as TransferStok[];
    },
  });

  // --- Client-side filtering ---
  const filteredData = daftarTransfer.filter((item) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    const namaTujuan = item.keLokasi?.nama?.toLowerCase() || "";
    return (
      item.nomorTransfer.toLowerCase().includes(searchLower) ||
      namaTujuan.includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947] flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#D4A373]" /> Surat Jalan (Transfer
            Stok)
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Pantau dan kelola pengiriman fisik barang dari Gudang Pusat ke
            Outlet.
          </p>
        </div>
      </div>

      {/* FILTER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#0A2947]/10 pb-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {(["ALL", "PENDING", "DIKIRIM", "DITERIMA", "BATAL"] as const).map(
            (tab) => (
              <Button
                key={tab}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 font-bold transition-all text-xs ${
                  activeTab === tab
                    ? "bg-[#0A2947] text-white hover:bg-[#0A2947]/90"
                    : "text-[#0A2947]/60 hover:text-[#0A2947] hover:bg-[#0A2947]/5"
                }`}
              >
                {tab === "ALL"
                  ? "Semua Status"
                  : tab === "PENDING"
                    ? "DRAFT SJ"
                    : tab === "DIKIRIM"
                      ? "SEDANG DIKIRIM"
                      : tab === "DITERIMA"
                        ? "SELESAI"
                        : "DIBATALKAN"}
              </Button>
            ),
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
          <Input
            placeholder="Cari No. Transfer / Outlet Tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947]"
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F2EAE1] text-xs uppercase font-bold text-[#0A2947]/70">
              <tr>
                <th className="px-6 py-4">Informasi Surat Jalan</th>
                <th className="px-6 py-4">Tujuan Pengiriman</th>
                <th className="px-6 py-4 text-center">Jumlah Item</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-40 bg-[#0A2947]/10 mb-2" />
                      <Skeleton className="h-4 w-24 bg-[#0A2947]/10" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-32 bg-[#0A2947]/10" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-5 w-16 mx-auto bg-[#0A2947]/10" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-24 mx-auto bg-[#0A2947]/10 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-8 w-24 ml-auto bg-[#0A2947]/10" />
                    </td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-[#0A2947]/50 font-medium"
                  >
                    <PackageSearch className="w-12 h-12 mx-auto mb-3 text-[#0A2947]/20" />
                    Tidak ada dokumen Surat Jalan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#FFFAF3] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold font-mono text-[#0A2947]">
                          {item.nomorTransfer}
                        </span>
                        <span className="text-xs font-medium text-[#0A2947]/50 mt-1">
                          {formatTanggal(item.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0A2947]">
                          {item.keLokasi?.nama || "Outlet Tidak Dikenal"}
                        </span>
                        <span className="text-xs font-medium text-[#0A2947]/50 mt-1 capitalize">
                          Terkait:{" "}
                          {item.pengajuanStokID
                            ? "Pengajuan Stok"
                            : "Transfer Manual"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-[#0A2947] bg-[#0A2947]/5 px-3 py-1 rounded-lg">
                        {item.items?.length || 0} Macam
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant={
                          item.status === "PENDING" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/gudang/transferStok/${item.id}`,
                          )
                        }
                        className={
                          item.status === "PENDING"
                            ? "bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm cursor-pointer"
                            : "cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm"
                        }
                      >
                        <Eye className="w-4 h-4 mr-2" /> Detail
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
