"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useDebounce } from "@/hooks/use-debounce";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { JurnalStok } from "@/types/jurnalStok";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  BookOpen,
  ArrowDownRight,
  ArrowUpRight,
  MapPin,
  CalendarClock,
  User,
  Filter,
  AlertTriangle,
} from "lucide-react";

// --- Helpers ---
const formatTanggal = (iso: string | undefined) => {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMM yyyy, HH:mm", { locale: localeID });
};

export default function JurnalStokOutletPage() {
  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [tipeFilter, setTipeFilter] = useState<string>("ALL");
  const [alasanFilter, setAlasanFilter] = useState<string>("ALL");

  // --- Queries ---
  // 1. Ambil Identitas Lokasi Outlet Saat Ini
  const { data: activeLocation = null, isLoading: isLoadingLokasi } = useQuery<any>({
    queryKey: ["lokasi-current-active-tenant"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/location/current", undefined, "pengguna");
        const raw = res?.data?.data || res?.data || res;
        if (Array.isArray(raw)) {
          return raw.length > 0 ? raw[0] : null;
        }
        return raw || null;
      } catch (error) {
        return null;
      }
    },
  });

  const activeLocationId = activeLocation?._id || activeLocation?.id;
  const activeLocationName = activeLocation?.nama || activeLocation?.namaLokasi || activeLocation?.namaToko || "Outlet Saat Ini";

  // 2. Ambil Seluruh Data Jurnal Stok
  const { data: rawData = [], isLoading: isLoadingJurnal } = useQuery({
    queryKey: queryKeys.jurnalStok(),
    queryFn: async () => {
      const res = await apiClient.get<any>("/jurnalStok", undefined, "pengguna");
      const data = res.data?.data || res.data || [];
      return Array.isArray(data) ? (data as JurnalStok[]) : [];
    },
  });

  // --- Client-Side Filtering & Sorting & Data Isolation ---
  const filteredJurnal = useMemo(() => {
    let result = Array.isArray(rawData) ? rawData : [];

    // Tembok Isolasi Data: Hanya tampilkan jika ID Lokasi Jurnal cocok dengan ID Outlet aktif
    if (activeLocationId) {
      result = result.filter(
        (jurnal) => (jurnal.locationID?._id || jurnal.locationID?.id) === activeLocationId
      );
    } else {
      // Jika lokasi belum termuat atau gagal, amankan dengan me-return array kosong
      result = [];
    }

    // Filter Pencarian Barang
    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase();
      result = result.filter((jurnal) =>
        jurnal.bahanBakuID?.namaBahan?.toLowerCase().includes(lowerSearch)
      );
    }

    // Filter Tipe Koreksi
    if (tipeFilter !== "ALL") {
      result = result.filter((jurnal) => jurnal.tipeKoreksi === tipeFilter);
    }

    // Filter Alasan
    if (alasanFilter !== "ALL") {
      result = result.filter((jurnal) => jurnal.alasan === alasanFilter);
    }

    // Urutkan berdasarkan tanggal terbaru di atas
    result.sort(
      (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
    );

    return result;
  }, [rawData, debouncedSearch, tipeFilter, alasanFilter, activeLocationId]);

  const isLoadingData = isLoadingLokasi || isLoadingJurnal;
  const isLocationEmpty = !isLoadingLokasi && !activeLocationId;

  return (
    <div className="flex flex-col gap-6 px-4 py-8 w-full max-w-7xl mx-auto">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-[#0A2947]/10 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black tracking-tight text-[#0A2947] flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-[#D4A373]" />
            Buku Jurnal Stok
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            CCTV Operasional: Melacak riwayat masuk-keluar barang khusus di <strong className="text-[#0A2947]">{activeLocationName}</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0A2947]/40" />
            <Input
              placeholder="Cari nama barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLocationEmpty}
              className="pl-9 h-10 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947] font-medium shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <Select value={tipeFilter} onValueChange={setTipeFilter} disabled={isLocationEmpty}>
              <SelectTrigger className="w-full sm:w-[140px] h-10 bg-white border-[#0A2947]/20 text-[#0A2947] font-bold focus:ring-[#0A2947] shadow-sm">
                <Filter className="w-3.5 h-3.5 mr-2 text-[#0A2947]/50" />
                <SelectValue placeholder="Semua Arah" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
                <SelectItem value="ALL" className="font-bold">Semua Arah</SelectItem>
                <SelectItem value="Masuk" className="font-bold text-emerald-600">Barang Masuk</SelectItem>
                <SelectItem value="Keluar" className="font-bold text-rose-600">Barang Keluar</SelectItem>
              </SelectContent>
            </Select>

            <Select value={alasanFilter} onValueChange={setAlasanFilter} disabled={isLocationEmpty}>
              <SelectTrigger className="w-full sm:w-[160px] h-10 bg-white border-[#0A2947]/20 text-[#0A2947] font-bold focus:ring-[#0A2947] shadow-sm">
                <SelectValue placeholder="Semua Alasan" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
                <SelectItem value="ALL" className="font-bold">Semua Alasan</SelectItem>
                <SelectItem value="Transfer Gudang" className="font-medium">Suplai / Transfer</SelectItem>
                <SelectItem value="Stok Opname" className="font-medium">Stok Opname</SelectItem>
                <SelectItem value="Rusak/Hilang" className="font-medium">Rusak / Hilang</SelectItem>
                <SelectItem value="Lainnya" className="font-medium">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* STATE ERROR LOKASI */}
      {isLocationEmpty ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm flex flex-col items-center text-center gap-4 py-12">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <div>
            <h2 className="text-xl font-bold text-rose-700">Identitas Outlet Tidak Ditemukan</h2>
            <p className="text-sm font-medium text-rose-600/80 mt-1 max-w-md mx-auto">
              Sistem keamanan mencegah penampilan Jurnal Stok karena lokasi kerja Anda saat ini belum dikonfigurasi. Harap periksa pengaturan profil lokasi Anda.
            </p>
          </div>
        </div>
      ) : (
        /* TABLE SECTION */
        <div className="rounded-2xl border border-[#0A2947]/10 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-[#F2EAE1] text-[11px] uppercase tracking-wider font-black text-[#0A2947]/60 border-b border-[#0A2947]/10">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Waktu Transaksi</th>
                  <th className="px-6 py-4">Informasi Barang</th>
                  <th className="px-6 py-4">Alasan / Konteks</th>
                  <th className="px-6 py-4 text-right">Pergerakan Angka</th>
                  <th className="px-6 py-4 rounded-tr-2xl">PIC (Penanggung Jawab)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0A2947]/5">
                {isLoadingData ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32 bg-[#0A2947]/10" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-48 bg-[#0A2947]/10" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24 bg-[#0A2947]/10" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20 ml-auto bg-[#0A2947]/10" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32 bg-[#0A2947]/10" /></td>
                    </tr>
                  ))
                ) : filteredJurnal.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center flex flex-col items-center justify-center w-full"
                    >
                      <BookOpen className="w-12 h-12 mb-3 text-[#0A2947]/20" />
                      <span className="text-[#0A2947]/50 font-bold text-lg">Buku Jurnal Kosong</span>
                      <span className="text-[#0A2947]/40 font-medium text-sm mt-1">
                        Belum ada riwayat pergerakan barang di outlet ini.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredJurnal.map((jurnal) => {
                    const isMasuk = jurnal.tipeKoreksi === "Masuk";
                    
                    return (
                      <tr
                        key={jurnal._id || jurnal.id}
                        className="hover:bg-[#FFFAF3]/60 transition-colors group"
                      >
                        {/* KOLOM 1: TANGGAL */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-[#0A2947] flex items-center gap-1.5">
                              <CalendarClock className="w-3.5 h-3.5 text-[#0A2947]/40" />
                              {formatTanggal(jurnal.tanggal).split(",")[0]}
                            </span>
                            <span className="text-[11px] font-bold text-[#0A2947]/50">
                              Pukul {formatTanggal(jurnal.tanggal).split(",")[1]}
                            </span>
                          </div>
                        </td>

                        {/* KOLOM 2: BARANG & LOKASI */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "font-bold text-base", 
                              jurnal.bahanBakuID ? "text-[#0A2947]" : "text-rose-500 line-through"
                            )}>
                              {jurnal.bahanBakuID?.namaBahan || "Master Data Terhapus"}
                            </span>
                            <span className="text-[10px] font-bold text-[#0A2947]/50 uppercase flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#D4A373]" /> 
                              {jurnal.locationID?.nama || "Lokasi Tidak Diketahui"}
                            </span>
                          </div>
                        </td>

                        {/* KOLOM 3: ALASAN JURNAL */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col items-start gap-1.5">
                            <Badge variant="outline" className={cn(
                              "text-[10px] uppercase font-black tracking-wider border",
                              jurnal.alasan === "Transfer Gudang" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              jurnal.alasan === "Stok Opname" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              jurnal.alasan === "Rusak/Hilang" ? "bg-rose-50 text-rose-700 border-rose-200" :
                              "bg-slate-50 text-slate-700 border-slate-200"
                            )}>
                              {jurnal.alasan}
                            </Badge>
                            {jurnal.keterangan && (
                              <span className="text-[11px] font-medium text-[#0A2947]/60 italic max-w-[200px] truncate" title={jurnal.keterangan}>
                                "{jurnal.keterangan}"
                              </span>
                            )}
                          </div>
                        </td>

                        {/* KOLOM 4: PERGERAKAN ANGKA */}
                        <td className="px-6 py-4 align-top text-right">
                          <div className={cn(
                            "inline-flex flex-col items-end px-3 py-1.5 rounded-lg border",
                            isMasuk 
                              ? "bg-emerald-50 border-emerald-100" 
                              : "bg-rose-50 border-rose-100"
                          )}>
                            <span className={cn(
                              "text-lg font-mono font-black flex items-center gap-1",
                              isMasuk ? "text-emerald-700" : "text-rose-700"
                            )}>
                              {isMasuk ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                              {isMasuk ? "+" : "-"}{jurnal.jumlah}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold uppercase",
                              isMasuk ? "text-emerald-700/60" : "text-rose-700/60"
                            )}>
                              {jurnal.bahanBakuID?.satuan || "UNIT"}
                            </span>
                          </div>
                        </td>

                        {/* KOLOM 5: PENCATAT (PIC) */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-6 h-6 rounded-full bg-[#0A2947]/10 flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-[#0A2947]/50" />
                            </div>
                            <span className="font-bold text-[#0A2947] capitalize">
                              {jurnal.dicatatOleh?.nama || "Sistem Otomatis"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
