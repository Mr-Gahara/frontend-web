"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { decodeJWT } from "@/lib/decodeToken";
import { queryKeys } from "@/lib/queryKeys";
import { CreateOpnameRequest } from "@/types/stockOpname";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  User,
  FileText,
  Save,
  AlertTriangle,
  Settings
} from "lucide-react";

// Interface untuk struktur response standard dari backend lo
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export default function BuatStockOpnamePage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- STATE FORM ---
  const [currentUserName, setCurrentUserName] = useState("Memuat data Anda...");
  const [locationID, setLocationID] = useState("");
  const [locationName, setLocationName] = useState("Memuat lokasi aktif...");
  const [picID, setPicID] = useState("");
  const [catatan, setCatatan] = useState("");
  const [formError, setFormError] = useState("");

  // --- MENGAMBIL USER ID & NAMA DENGAN AMAN DARI TOKEN ---
  useEffect(() => {
    const token = sessionStorage.getItem("penggunaToken");
    if (token) {
      const payloadToken = decodeJWT(token);
      const id = payloadToken?._id || payloadToken?.id || "";
      const nama = payloadToken?.nama || payloadToken?.name || "Anda (Pengguna Saat Ini)";
      
      setPicID(id);
      setCurrentUserName(nama);
    }
  }, []);

  // --- FETCH DATA LOKASI AKTIF DARI BACKEND ---
  const { data: activeLocation = null, isLoading: isLoadingLokasi } = useQuery<any>({
    // GANTI QUERY KEY: Biar cache lama yang nyimpen array ke-hapus/terganti
    queryKey: ["lokasi-current-active-tenant"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(
          "/location/current", 
          undefined, 
          "pengguna"
        );
        
        // Bulletproof extractor: Jaga-jaga kalau backend bungkus response-nya beda-beda
        const raw = res?.data?.data || res?.data || res;
        
        // Kalau ternyata array (fallback), ambil index 0. Kalau object, return object-nya langsung.
        if (Array.isArray(raw)) {
          return raw.length > 0 ? raw[0] : null;
        }
        return raw || null;
      } catch (error) {
        return null;
      }
    },
    refetchOnMount: true, // Paksa refresh data tiap buka laman ini
  });

  // --- AUTO-SET LOKASI BILA DATA TERSEDIA ---
  useEffect(() => {
    if (!isLoadingLokasi) {
      // Pastikan activeLocation punya id yang valid (bisa id atau _id dari mongoose)
      if (activeLocation && (activeLocation.id || activeLocation._id)) {
        const idLoc = activeLocation.id || activeLocation._id;
        const namaLoc = activeLocation.nama || activeLocation.namaLokasi || activeLocation.namaToko || "Lokasi Aktif";
        const tipeLoc = activeLocation.tipe || "Outlet";

        setLocationID(idLoc);
        setLocationName(`${namaLoc} (${tipeLoc})`);
      } else {
        setLocationID("");
        setLocationName("");
      }
    }
  }, [activeLocation, isLoadingLokasi]);

  // --- MUTASI CREATE DRAFT OPNAME ---
  const createMutation = useMutation({
    mutationFn: async (payload: CreateOpnameRequest) => {
      return await apiClient.post<ApiResponse<{ _id?: string; id?: string }>>(
        "/stockopname", 
        payload, 
        undefined, 
        "pengguna"
      );
    },
    onSuccess: (res) => {
      toast.success("Draft Opname Berhasil Dibuat", {
        description: "Sistem telah mengambil snapshot stok saat ini.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOpname });
      
      // Mengambil ID untuk redirect
      const newOpnameId = res.data?._id || res.data?.id || (res as any)?._id;
      if (newOpnameId) {
        router.push(`/dashboard/inventaris/stockOpname/${newOpnameId}`);
      } else {
        router.push("/dashboard/inventaris/stockOpname");
      }
    },
    onError: (err: any) => {
      setFormError(
        err.message || 
        "Gagal membuat draft opname. Pastikan ada item di lokasi tersebut."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!locationID) return setFormError("Lokasi tidak valid. Silakan setup lokasi terlebih dahulu.");
    if (!picID) return setFormError("Sesi login tidak valid. Data penanggung jawab tidak ditemukan.");

    const payload: CreateOpnameRequest = {
      locationID,
      picID,
      catatan: catatan.trim() || undefined,
    };

    createMutation.mutate(payload);
  };

  // Validasi: Lokasi dianggap kosong kalau fetch selesai TAPI data null ATAU tidak ada id valid
  const isLocationEmpty = !isLoadingLokasi && (!activeLocation || (!activeLocation.id && !activeLocation._id));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/inventaris/stockOpname")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Opname
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg shrink-0 shadow-sm">
            <ClipboardList className="w-6 h-6 text-[#D4A373]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
              Buat Draft Opname
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Inisiasi sesi opname baru. Sistem otomatis mendeteksi Outlet/Gudang aktif Anda.
            </p>
          </div>
        </div>
      </div>

      {/* VALIDASI LOKASI BELUM SETUP */}
      {isLocationEmpty && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm flex flex-col items-center text-center gap-4">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <div>
            <h2 className="text-lg font-bold text-rose-700">Lokasi / Gudang Belum Diatur</h2>
            <p className="text-sm font-medium text-rose-600/80 mt-1 max-w-md">
              Sistem tidak dapat menemukan data lokasi untuk outlet/gudang yang sedang Anda akses saat ini. Anda harus mengatur profil lokasi terlebih dahulu sebelum melakukan Stok Opname.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/pengaturan/lokasi")} 
            className="cursor-pointer bg-rose-600 text-white hover:bg-rose-700 font-bold shadow-sm mt-2"
          >
            <Settings className="w-4 h-4 mr-2" /> Setup Lokasi Sekarang
          </Button>
        </div>
      )}

      {/* FORM SECTION */}
      {!isLocationEmpty && (
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 sm:p-8">
            
            <div className="space-y-5">
              {/* Read-Only Lokasi (Auto-detect Tenant) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947] flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#D4A373]" />
                  Lokasi Audit / Gudang
                </label>
                <div className="flex items-center w-full h-12 px-4 bg-[#0A2947]/5 border border-[#0A2947]/10 rounded-lg text-[#0A2947]/60 font-bold cursor-not-allowed">
                  {isLoadingLokasi ? "Memeriksa lokasi aktif..." : locationName}
                </div>
                <p className="text-xs font-medium text-[#0A2947]/50 mt-1">
                  Sistem otomatis mendeteksi bahwa Anda sedang beroperasi di lokasi ini.
                </p>
              </div>

              {/* Read-Only PIC */}
              <div className="space-y-2 pt-2 border-t border-[#0A2947]/10 mt-2">
                <label className="text-sm font-bold text-[#0A2947] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#D4A373]" />
                  Penanggung Jawab (PIC)
                </label>
                <div className="flex items-center w-full h-12 px-4 bg-[#0A2947]/5 border border-[#0A2947]/10 rounded-lg text-[#0A2947]/60 font-bold cursor-not-allowed">
                  {currentUserName}
                </div>
                <p className="text-xs font-medium text-[#0A2947]/50 mt-1">
                  Sistem otomatis mencatat Anda sebagai PIC sesi opname ini.
                </p>
              </div>

              {/* Input Catatan */}
              <div className="space-y-2 pt-2 border-t border-[#0A2947]/10 mt-2">
                <label className="text-sm font-bold text-[#0A2947] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#D4A373]" />
                  Catatan Opname <span className="text-[#0A2947]/50 font-medium">(Opsional)</span>
                </label>
                <Input
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Misal: Audit rutin akhir bulan..."
                  className="bg-[#FFFAF3] h-12 border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-medium"
                />
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="rounded-xl bg-red-500/10 p-4 text-sm font-bold text-red-600 border border-red-500/20 mt-2 shadow-sm">
                {formError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/inventaris/stockOpname")}
                disabled={createMutation.isPending}
                className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-11 px-6"
              >
                Batal
              </Button>
              <Button
                type="submit"
                // Tombol di-disable kalau id lokasi kosong, id pic kosong, atau masih loading
                disabled={createMutation.isPending || !locationID || !picID || isLoadingLokasi}
                className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold h-11 px-6 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  "Memproses Draft..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4 text-[#D4A373]" />
                    Buat Draft & Mulai Opname
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}