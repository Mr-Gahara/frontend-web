"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { TransferStok } from "@/types/transferStok";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Truck,
  MapPin,
  Clock,
  ArrowRight,
  PackageOpen,
  Package,
  CheckCircle2
} from "lucide-react";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const getLamaPerjalanan = (tanggalKirim: string | null) => {
  if (!tanggalKirim) return "-";
  return formatDistanceToNow(new Date(tanggalKirim), { locale: localeID, addSuffix: true });
};

export default function PenerimaanBarangOutletPage() {
  useAuthGuard();
  const router = useRouter();

  // --- State ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // --- Queries ---
  // 1. Dapatkan ID Lokasi Outlet
  const { data: outletId, isLoading: isLoadingLokasi } = useQuery({
    queryKey: ["lokasi", "outlet-only"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/location", undefined, "pengguna");
        const raw = res.data?.data || res.data || [];
        const locations = Array.isArray(raw) ? raw : [];
        const outlet = locations.find((loc: any) => loc.tipe === "Outlet");
        const finalId = outlet?._id || outlet?.id;
        return finalId ? finalId : null;
      } catch (err) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch Seluruh Transfer Stok (Auto Polling tiap 30 detik untuk pantau truk)
  const { data: semuaTransfer = [], isLoading: isLoadingTransfers } = useQuery({
    queryKey: queryKeys.transferStok(),
    queryFn: async () => {
      const res = await apiClient.get<any>("/transferStok", undefined, "pengguna");
      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? (raw as TransferStok[]) : [];
    },
    refetchInterval: 30000, 
    enabled: !!outletId,
  });

  // --- Filtering ---
  const filteredData = semuaTransfer.filter((item) => {
    // 1. FILTER WAJIB: Hanya yang statusnya DIKIRIM dan tujuannya ke Outlet ini
    const isForThisOutlet = item.keLokasi?.id === outletId;
    const isDikirim = item.status === "DIKIRIM";

    if (!isForThisOutlet || !isDikirim) return false;

    // 2. FILTER PENCARIAN (Opsional)
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      const gudangName = item.dariLokasi?.nama?.toLowerCase() || "";
      return item.nomorTransfer.toLowerCase().includes(searchLower) || gudangName.includes(searchLower);
    }

    return true;
  });

  const isLoading = isLoadingLokasi || isLoadingTransfers;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl shrink-0 shadow-sm text-amber-600">
            <PackageOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Penerimaan Barang (Inbound)
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Pantau dan konfirmasi fisik barang yang sedang dikirim dari Gudang Pusat.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
          <Input
            placeholder="Cari SJ / Nama Gudang Asal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947] h-11"
          />
        </div>
      </div>

      {/* GRID KARTU KEDATANGAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-55 w-full rounded-2xl bg-[#0A2947]/10" />
          ))
        ) : filteredData.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white border border-[#0A2947]/10 rounded-2xl shadow-sm">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="bg-[#F2EAE1] p-6 rounded-full text-[#0A2947]/20">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#0A2947]">Tidak Ada Kiriman Tertunda</h3>
                <p className="text-sm font-medium text-[#0A2947]/50 max-w-md mx-auto">
                  Belum ada armada logistik yang sedang dalam perjalanan menuju Outlet ini. Sistem akan otomatis memunculkan data jika Gudang memproses Surat Jalan baru.
                </p>
              </div>
            </div>
          </div>
        ) : (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white border border-[#0A2947]/10 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col relative group">
              {/* Efek Garis Samping */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 opacity-80" />
              
              <div className="pl-5 pr-4 py-4 border-b border-[#0A2947]/5 flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="font-mono font-bold text-[#0A2947] text-lg leading-none">
                    {item.nomorTransfer}
                  </span>
                  <span className="text-xs font-bold text-[#0A2947]/50 capitalize">
                    Pengirim: {item.pengirim?.nama || "Admin Gudang"}
                  </span>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold px-2 py-0.5 animate-pulse shrink-0">
                  <Truck className="w-3 h-3 mr-1" /> Menuju Toko
                </Badge>
              </div>
              
              <div className="p-5 space-y-4 flex-1 pl-6">
                {/* Rute Visual */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0A2947]/20" />
                    <div className="w-0.5 h-6 bg-[#0A2947]/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  </div>
                  <div className="flex flex-col justify-between h-11.5 flex-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#0A2947]/40 uppercase">Dari Pusat</span>
                      <span className="text-sm font-bold text-[#0A2947] truncate leading-tight">{item.dariLokasi?.nama || "Gudang"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-emerald-600/70 uppercase">Tujuan</span>
                      <span className="text-sm font-bold text-emerald-700 truncate leading-tight">Lokasi Anda</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#FFFAF3] p-3 rounded-xl border border-[#0A2947]/5 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase">Diberangkatkan</span>
                    <span className="text-xs font-bold text-[#0A2947]">{formatTanggal(item.tanggalKirim)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase">Estimasi Waktu</span>
                    <span className="text-xs font-bold text-amber-600">{getLamaPerjalanan(item.tanggalKirim)}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-blue-50/50 border-t border-blue-100 flex items-center justify-between mt-auto">
                 <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                  <Package className="w-4 h-4" />
                  {item.items?.length || 0} Macam Barang
                </div>
                <Button 
                  size="sm" 
                  className="font-bold bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm"
                  onClick={() => router.push(`/dashboard/outlet/inventaris/penerimaanBarang/${item.id}`)}
                >
                  Proses Terima <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}