"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
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
  PackageCheck,
  Package,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

// --- Helpers ---
const formatTanggal = (iso: string | null) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

const getLamaPerjalanan = (tanggalKirim: string | null) => {
  if (!tanggalKirim) return "-";
  return formatDistanceToNow(new Date(tanggalKirim), {
    locale: localeID,
    addSuffix: true,
  });
};

export default function PengirimanStokGudangPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // --- Queries ---
  // Halaman ini KHUSUS hanya memanggil data yang berstatus DIKIRIM (In-Transit)
  const { data: daftarPengiriman = [], isLoading } = useQuery({
    queryKey: queryKeys.transferStok({ status: "DIKIRIM" }),
    queryFn: async () => {
      const res = await apiClient.get<any>(
        "/transferStok",
        { status: "DIKIRIM" },
        "pengguna",
      );
      return (res.data?.data || res.data || []) as TransferStok[];
    },
    // Polling setiap 30 detik untuk melihat apakah Outlet sudah klik "Terima"
    refetchInterval: 30000,
  });

  const filteredData = daftarPengiriman.filter((item) => {
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
            <Truck className="w-6 h-6 text-amber-500" /> Radar Pengiriman
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Pantau armada logistik yang sedang dalam perjalanan menuju Outlet.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
          <Input
            placeholder="Cari SJ / Outlet Tujuan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947]"
          />
        </div>
      </div>

      {/* STATISTIK CEPAT */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-800/70 uppercase tracking-wider">
              Truk di Jalan
            </p>
            <h3 className="text-2xl font-black text-amber-900">
              {daftarPengiriman.length}
            </h3>
          </div>
        </div>
        <div className="bg-[#0A2947]/5 border border-[#0A2947]/10 rounded-2xl p-4 flex items-center gap-4 sm:col-span-2">
          <div className="bg-[#0A2947]/10 p-3 rounded-xl text-[#0A2947]">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0A2947]/70 uppercase tracking-wider">
              Informasi Radar
            </p>
            <p className="text-sm font-medium text-[#0A2947]">
              Layar ini akan otomatis memperbarui data ketika Outlet
              mengonfirmasi penerimaan barang. Dokumen yang telah selesai akan
              otomatis berpindah ke arsip Transfer Stok.
            </p>
          </div>
        </div>
      </div>

      {/* GRID KARTU PENGIRIMAN (Bukan Tabel, agar terasa seperti Dashboard Tracking) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-48 w-full rounded-2xl bg-[#0A2947]/10"
            />
          ))
        ) : filteredData.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white border border-[#0A2947]/10 rounded-2xl">
            <PackageCheck className="w-16 h-16 mx-auto mb-4 text-[#0A2947]/20" />
            <h3 className="text-lg font-bold text-[#0A2947]">
              Semua Pengiriman Tuntas
            </h3>
            <p className="text-sm font-medium text-[#0A2947]/50 mt-1">
              Tidak ada armada truk yang sedang berada di jalan saat ini.
            </p>
          </div>
        ) : (
          filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#0A2947]/10 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              <div className="bg-[#F2EAE1] px-5 py-3 border-b border-[#0A2947]/5 flex justify-between items-center">
                <span className="font-mono font-bold text-[#0A2947] text-sm">
                  {item.nomorTransfer}
                </span>
                <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold px-2 py-0.5 animate-pulse">
                  Dalam Perjalanan
                </Badge>
              </div>

              <div className="p-5 space-y-4 flex-1">
                {/* Rute Visual */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0A2947]" />
                    <div className="w-0.5 h-6 bg-[#0A2947]/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </div>
                  <div className="flex flex-col justify-between h-11.5 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-[#0A2947] truncate">
                        {item.dariLokasi?.nama || "Gudang"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-amber-700 truncate">
                        {item.keLokasi?.nama || "Outlet"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-[#FFFAF3] p-3 rounded-xl border border-[#0A2947]/5 mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase">
                      Berangkat
                    </span>
                    <span className="text-xs font-bold text-[#0A2947]">
                      {formatTanggal(item.tanggalKirim)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase">
                      Lama Perjalanan
                    </span>
                    <span className="text-xs font-bold text-amber-600">
                      {getLamaPerjalanan(item.tanggalKirim)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-[#0A2947]/70">
                  <Package className="w-4 h-4 text-[#D4A373]" />
                  Membawa {item.items?.length || 0} Macam Barang
                </div>
              </div>

              <div className="px-5 py-3 bg-[#0A2947]/5 border-t border-[#0A2947]/5 mt-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between font-bold text-[#0A2947] hover:bg-white hover:shadow-sm"
                  onClick={() =>
                    router.push(`/dashboard/gudang/transferStok/${item.id}`)
                  }
                >
                  Cek Detail Muatan <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
