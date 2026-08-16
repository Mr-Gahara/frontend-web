"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { PengajuanStok, StatusPengajuan } from "@/types/pengajuanStok";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  PlusCircle,
  PackageSearch,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  ArrowRight,
  Eye
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const getStatusBadge = (status: StatusPengajuan) => {
  switch (status) {
    case "DRAFT":
      return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-bold">Draft</Badge>;
    case "SUBMITTED":
    case "PENDING":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-bold"><Clock className="w-3 h-3 mr-1" /> Menunggu</Badge>;
    case "APPROVED":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-bold"><CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui</Badge>;
    case "COMPLETED":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none font-bold">Selesai</Badge>;
    case "REJECTED":
      return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none font-bold"><XCircle className="w-3 h-3 mr-1" /> Ditolak</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function PengajuanStokOutletPage() {
  const router = useRouter();
  
  // --- States ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [activeTab, setActiveTab] = useState<StatusPengajuan | "ALL">("ALL");

  // --- Queries ---
  const { data: daftarPengajuan = [], isLoading } = useQuery({
    queryKey: queryKeys.pengajuanStok({ status: activeTab !== "ALL" ? activeTab : undefined }),
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (activeTab !== "ALL") params.status = activeTab;
      // Endpoint disesuaikan dengan standar camelCase/kebab-case backend. Defaulting to /pengajuanStok
      const res = await apiClient.get<any>("/pengajuanStok", params, "pengguna");
      return (res.data?.data || res.data || []) as PengajuanStok[];
    },
  });

  // --- Client-side filtering untuk pencarian (opsional, backend bisa handle ini jika endpoint mendukung) ---
  const filteredData = daftarPengajuan.filter((item) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return item.nomorPengajuan.toLowerCase().includes(searchLower);
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Pengajuan Stok Barang
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Kelola permintaan suplai bahan baku dan barang jadi ke Gudang Pusat.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/outlet/inventaris/pengajuanStok/buatPengajuan")}
          className="bg-[#D4A373] text-[#0A2947] hover:bg-[#D4A373]/90 font-bold shadow-sm"
        >
          <PlusCircle className="w-4 h-4 mr-2" /> Buat Pengajuan Baru
        </Button>
      </div>

      {/* FILTER & TABS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#0A2947]/10 pb-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
          {(["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "COMPLETED"] as const).map((tab) => (
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
              {tab === "ALL" ? "Semua Status" : tab === "SUBMITTED" ? "MENUNGGU" : tab}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
          <Input
            placeholder="Cari No. Pengajuan..."
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
                <th className="px-6 py-4">Informasi Pengajuan</th>
                <th className="px-6 py-4">Tujuan (Gudang)</th>
                <th className="px-6 py-4 text-center">Item</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2947]/5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-40 bg-[#0A2947]/10 mb-2" /><Skeleton className="h-4 w-24 bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32 bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-16 mx-auto bg-[#0A2947]/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 mx-auto bg-[#0A2947]/10 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto bg-[#0A2947]/10" /></td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#0A2947]/50 font-medium">
                    <PackageSearch className="w-12 h-12 mx-auto mb-3 text-[#0A2947]/20" />
                    Tidak ada data pengajuan stok yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FFFAF3] transition-colors">
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
                      <div className="flex items-center gap-2 font-medium text-[#0A2947]/80">
                        {item.keLokasi?.nama || "Gudang Pusat"}
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
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/outlet/inventaris/pengajuanStok/${item.id}`)}
                        className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm"
                      >
                        {item.status === "DRAFT" ? (
                          <><FileEdit className="w-4 h-4 mr-2 text-[#D4A373]" /> Lanjutkan Draft</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" /> Detail</>
                        )}
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