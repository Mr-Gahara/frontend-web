"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { decodeJWT } from "@/lib/decodeToken";
import { queryKeys } from "@/lib/queryKeys";
import { CreateOpnameRequest } from "@/types/stockOpname";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// --- Form & Validation ---
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  User,
  FileText,
  Save,
  AlertTriangle,
  Settings,
} from "lucide-react";

// Interface untuk struktur response standard dari backend
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// --- ZOD SCHEMA ---
const opnameSchema = z.object({
  locationID: z
    .string()
    .min(1, "Lokasi tidak valid. Silakan pilih gudang terlebih dahulu."),
  picID: z
    .string()
    .min(1, "Sesi login tidak valid. Data penanggung jawab tidak ditemukan."),
  catatan: z.string().optional(),
});

type OpnameFormInput = z.input<typeof opnameSchema>;
type OpnameFormOutput = z.output<typeof opnameSchema>;

export default function BuatStockOpnameGudangPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  // State untuk label (hanya untuk keperluan visual)
  const [currentUserName, setCurrentUserName] = useState("Memuat data Anda...");

  // --- REACT HOOK FORM ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OpnameFormInput, any, OpnameFormOutput>({
    resolver: zodResolver(opnameSchema),
    defaultValues: {
      locationID: "",
      picID: "",
      catatan: "",
    },
  });

  const watchLocationID = watch("locationID");
  const watchPicID = watch("picID");

  // --- MENGAMBIL USER ID & NAMA DENGAN AMAN DARI TOKEN ---
  useEffect(() => {
    const token = sessionStorage.getItem("penggunaToken");
    if (token) {
      const payloadToken = decodeJWT(token);
      const id = payloadToken?._id || payloadToken?.id || "";
      const nama =
        payloadToken?.nama || payloadToken?.name || "Anda (Pengguna Saat Ini)";

      setValue("picID", id);
      setCurrentUserName(nama);
    }
  }, [setValue]);

  // --- FETCH DATA SEMUA GUDANG DARI BACKEND ---
  const { data: gudangList = [], isLoading: isLoadingLokasi } = useQuery<any[]>({
    queryKey: ["lokasi-gudang-all"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(
          "/location",
          undefined,
          "pengguna"
        );
        const raw = res?.data?.data || res?.data || res;
        const allLocations = Array.isArray(raw) ? raw : [];
        
        // Filter khusus tipe Gudang
        return allLocations.filter((loc: any) => loc.tipe === "Gudang");
      } catch (error) {
        return [];
      }
    },
    refetchOnMount: true,
  });

  // --- AUTO-SET GUDANG JIKA HANYA ADA 1 ---
  useEffect(() => {
    if (!isLoadingLokasi && gudangList.length === 1) {
      const idLoc = gudangList[0].id || gudangList[0]._id;
      setValue("locationID", idLoc);
    }
  }, [gudangList, isLoadingLokasi, setValue]);

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
        description: "Sistem telah mengambil snapshot stok gudang saat ini.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockOpname() });

      // PERUBAHAN RUTE: Redirect ke Laman Eksekusi Gudang
      const newOpnameId = res.data?._id || res.data?.id || (res as any)?._id;
      if (newOpnameId) {
        router.push(`/dashboard/gudang/stockOpname/${newOpnameId}`);
      } else {
        router.push("/dashboard/gudang/stockOpname");
      }
    },
    onError: (err: any) => {
      toast.error("Gagal Memproses", {
        description:
          err.message ||
          "Gagal membuat draft opname. Pastikan ada item di gudang tersebut.",
      });
    },
  });

  // --- HANDLER SUBMIT DARI RHF ---
  const onSubmit = (data: OpnameFormOutput) => {
    if (!data.locationID || !data.picID) return;

    const payload: CreateOpnameRequest = {
      locationID: data.locationID,
      catatan: data.catatan?.trim() || undefined,
    };

    createMutation.mutate(payload);
  };

  const isLocationEmpty = !isLoadingLokasi && gudangList.length === 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/gudang/stockOpname")}
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
              Buat Draft Opname Gudang
            </h1>
            <p className="text-sm font-medium text-[#0A2947]/60">
              Inisiasi sesi audit stok fisik. Pilih gudang yang akan dihitung.
            </p>
          </div>
        </div>
      </div>

      {/* VALIDASI LOKASI BELUM SETUP */}
      {isLocationEmpty && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm flex flex-col items-center text-center gap-4">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <div>
            <h2 className="text-lg font-bold text-rose-700">
              Gudang Belum Didaftarkan
            </h2>
            <p className="text-sm font-medium text-rose-600/80 mt-1 max-w-md">
              Sistem tidak dapat menemukan data Gudang di akun Anda. Anda harus membuat profil Gudang terlebih dahulu sebelum melakukan Stok Opname.
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/gudang/pengaturan")}
            className="cursor-pointer bg-rose-600 text-white hover:bg-rose-700 font-bold shadow-sm mt-2"
          >
            <Settings className="w-4 h-4 mr-2" /> Setup Gudang Sekarang
          </Button>
        </div>
      )}

      {/* FORM SECTION */}
      {!isLocationEmpty && (
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm overflow-hidden">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6 p-6 sm:p-8"
          >
            <div className="space-y-5">
              {/* Input Lokasi Gudang */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947] flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#D4A373]" />
                  Lokasi Gudang yang Di-Opname <span className="text-rose-500">*</span>
                </label>
                
                <Select
                  value={watchLocationID}
                  onValueChange={(val) => setValue("locationID", val, { shouldValidate: true })}
                  disabled={isLoadingLokasi || createMutation.isPending}
                >
                  <SelectTrigger className="w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold h-12 focus:ring-[#0A2947]">
                    <SelectValue placeholder={isLoadingLokasi ? "Memuat gudang..." : "Pilih Gudang..."} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
                    {gudangList.map((gudang) => (
                      <SelectItem
                        key={gudang._id || gudang.id}
                        value={gudang._id || gudang.id}
                        className="cursor-pointer font-bold"
                      >
                        {gudang.nama || "Gudang Tanpa Nama"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="min-h-4">
                  {errors.locationID ? (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.locationID.message}
                    </span>
                  ) : (
                    <p className="text-xs font-medium text-[#0A2947]/50 mt-1">
                      {gudangList.length === 1 
                        ? "Gudang otomatis terpilih karena hanya ada 1 gudang yang terdaftar." 
                        : "Pilih gudang yang stok fisiknya akan Anda audit."}
                    </p>
                  )}
                </div>
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
                <div className="min-h-4">
                  {errors.picID && (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.picID.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Input Catatan */}
              <div className="space-y-2 pt-2 border-t border-[#0A2947]/10 mt-2">
                <label className="text-sm font-bold text-[#0A2947] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#D4A373]" />
                  Catatan Opname{" "}
                  <span className="text-[#0A2947]/50 font-medium">
                    (Opsional)
                  </span>
                </label>
                <Input
                  {...register("catatan")}
                  placeholder="Misal: Audit rutin bulanan Gudang Utama..."
                  className="bg-[#FFFAF3] h-12 border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 font-medium focus-visible:ring-1 focus-visible:ring-[#0A2947]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/gudang/stockOpname")}
                disabled={createMutation.isPending}
                className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-11 px-6"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  !watchLocationID ||
                  !watchPicID ||
                  isLoadingLokasi
                }
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
