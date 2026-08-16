"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { PengajuanStok, StatusPengajuan } from "@/types/pengajuanStok";
import { useDebounce } from "@/hooks/use-debounce";

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
  Inbox,
} from "lucide-react";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const getStatusBadge = (status: StatusPengajuan) => {
  switch (status) {
    case "SUBMITTED":
    case "PENDING":
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold">
          <Clock className="w-3 h-3 mr-1" /> Perlu Tinjauan
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Siap Dikirim
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold">
          Selesai
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none font-bold">
          <XCircle className="w-3 h-3 mr-1" /> Ditolak
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function PengajuanStokGudangPage() {
  const router = useRouter();

  // --- States ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  // Default tab untuk Gudang idealnya adalah yang butuh aksi (SUBMITTED)
  const [activeTab, setActiveTab] = useState<StatusPengajuan | "ALL">(
    "SUBMITTED",
  );

  // --- Queries ---
  const { data: daftarPengajuan = [], isLoading } = useQuery({
    queryKey: queryKeys.pengajuanStok({
      status: activeTab !== "ALL" ? activeTab : undefined,
    }),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (activeTab !== "ALL") params.status = activeTab;

      const res = await apiClient.get<any>(
        "/pengajuanStok",
        params,
        "pengguna",
      );
      return (res.data?.data || res.data || []) as PengajuanStok[];
    },
  });

  // --- Client-side filtering ---
  const filteredData = daftarPengajuan.filter((item) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    const namaOutlet = item.dariLokasi?.nama?.toLowerCase() || "";
    return (
      item.nomorPengajuan.toLowerCase().includes(searchLower) ||
      namaOutlet.includes(searchLower)
    );
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947] flex items-center gap-2">
            <Inbox className="w-6 h-6 text-[#D4A373]" /> Inbox Permintaan Stok
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Tinjau dan proses permintaan pasokan barang dari berbagai Outlet.
          </p>
        </div>
      </div>

      {/* FILTER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#0A2947]/10 pb-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {(
            ["SUBMITTED", "APPROVED", "COMPLETED", "REJECTED", "ALL"] as const
          ).map((tab) => (
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
                ? "Semua"
                : tab === "SUBMITTED"
                  ? "PERLU TINJAUAN"
                  : tab}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
          <Input
            placeholder="Cari No. Pengajuan / Outlet..."
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
                <th className="px-6 py-4">Nomor & Tanggal</th>
                <th className="px-6 py-4">Asal Peminta</th>
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
                    Belum ada permintaan stok di kategori ini.
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
                          {item.nomorPengajuan}
                        </span>
                        <span className="text-xs font-medium text-[#0A2947]/50 mt-1">
                          {formatTanggal(item.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#0A2947]">
                          {item.dariLokasi?.nama || "Outlet Tidak Dikenal"}
                        </span>
                        <span className="text-xs font-medium text-[#0A2947]/50 capitalize mt-1">
                          Pembuat: {item.dimintaOleh?.nama || "-"}
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
                          item.status === "SUBMITTED" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/dashboard/gudang/pengajuanStok/${item.id}`,
                          )
                        }
                        className={
                          item.status === "SUBMITTED"
                            ? "bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 font-bold shadow-sm cursor-pointer"
                            : "cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm"
                        }
                      >
                        <Eye className="w-4 h-4 mr-2" /> Tinjau
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
