"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BahanBakuRequest, SATUAN_BAHAN_OPTIONS } from "@/types/bahanBaku";

import { useForm, Controller, useWatch } from "react-hook-form";
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
import { ArrowLeft, PackagePlus, Info, Save, MapPin } from "lucide-react";

// --- ZOD SCHEMA ---
const bahanBakuSchema = z.object({
  namaBahan: z.string().min(1, "Nama bahan baku wajib diisi"),
  satuan: z.enum(SATUAN_BAHAN_OPTIONS, { message: "Silakan pilih satuan" }),
  stok: z.coerce.number().min(0, "Stok tidak boleh negatif").default(0),
  minimalStok: z.coerce
    .number()
    .min(0, "Batas stok minimum tidak boleh negatif")
    .default(0),
});

type BahanBakuFormInput = z.input<typeof bahanBakuSchema>;
type BahanBakuFormOutput = z.output<typeof bahanBakuSchema>;

export default function BuatBahanBakuPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeLocationId, setActiveLocationId] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("Memeriksa lokasi...");

  // --- FETCH DATA LOKASI AKTIF (CRITICAL FOR HYBRID DESIGN) ---
  const { data: activeLocation = null, isLoading: isLoadingLokasi } = useQuery<any>({
    queryKey: ["lokasi-current-active-tenant"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>("/location/current", undefined, "pengguna");
        const raw = res?.data?.data || res?.data || res;
        return Array.isArray(raw) ? (raw.length > 0 ? raw[0] : null) : (raw || null);
      } catch (error) {
        return null;
      }
    },
    refetchOnMount: true,
  });

  useEffect(() => {
    if (!isLoadingLokasi) {
      if (activeLocation && (activeLocation.id || activeLocation._id)) {
        const idLoc = activeLocation.id || activeLocation._id;
        const namaLoc = activeLocation.nama || activeLocation.namaLokasi || "Lokasi Aktif";
        setActiveLocationId(idLoc);
        setLocationName(namaLoc);
      } else {
        setLocationName("Lokasi tidak ditemukan");
      }
    }
  }, [activeLocation, isLoadingLokasi]);

  // --- REACT HOOK FORM ---
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BahanBakuFormInput, any, BahanBakuFormOutput>({
    resolver: zodResolver(bahanBakuSchema),
    defaultValues: {
      namaBahan: "",
      satuan: "gram",
      stok: 0,
      minimalStok: 0,
    },
  });

  const currentSatuan = useWatch({ control, name: "satuan" });

  // --- MUTATION CREATE ---
  const createMutation = useMutation<any, Error, BahanBakuRequest>({
    mutationFn: async (payload: BahanBakuRequest) => {
      try {
        return await apiClient.post("/bahan-baku", payload, undefined, "pengguna");
      } catch (error) {
        return await apiClient.post("/bahanBaku", payload, undefined, "pengguna");
      }
    },
    onSuccess: () => {
      toast.success("Berhasil Menambahkan", {
        description: "Bahan baku baru berhasil disimpan dan diinjeksi ke Inventory.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bahanBaku });
      // Invalidate inventory agar tabel Stok Real-time langsung terupdate
      queryClient.invalidateQueries({ queryKey: ["inventory"] }); 
      router.push("/dashboard/outlet/inventaris/bahanBaku");
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan", {
        description: err.message || "Terjadi kesalahan saat menyimpan data.",
      });
    },
  });

  // --- HANDLER SUBMIT ---
  const onSubmit = (data: BahanBakuFormOutput) => {
    // Gabungkan data form dengan locationID yang terdeteksi
    const payload: BahanBakuRequest = {
      ...data,
      locationID: activeLocationId || undefined, // Dikirim agar backend bisa inject ke Inventory
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/outlet/inventaris/bahanBaku")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Bahan Baku
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Tambah Bahan Baku
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Masukkan detail persediaan bahan mentah baru ke dalam sistem.
          </p>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm overflow-hidden">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-2 border-b border-[#0A2947]/10 pb-4">
            <div className="flex items-center gap-2">
              <PackagePlus className="h-5 w-5 text-[#D4A373]" />
              <h3 className="text-base font-bold text-[#0A2947]">
                Informasi Dasar
              </h3>
            </div>
            
            {/* Visual Indicator: Lokasi Injeksi Inventory */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#0A2947]/5 rounded-lg border border-[#0A2947]/10">
              <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
              <span className="text-xs font-bold text-[#0A2947]/70">
                Lokasi Stok: {locationName}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nama Bahan Baku */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Nama Bahan Baku <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("namaBahan")}
                placeholder="Contoh: Biji Kopi Arabica, Susu Segar, dsb."
                className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 h-12 focus-visible:ring-1 focus-visible:ring-[#0A2947]"
              />
              <div className="min-h-4">
                {errors.namaBahan && (
                  <span className="text-xs font-bold text-rose-500">
                    {errors.namaBahan.message}
                  </span>
                )}
              </div>
            </div>
            
            {/* Satuan */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Satuan <span className="text-red-500">*</span>
              </label>
              <Controller
                name="satuan"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full h-12 bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold focus:ring-1 focus:ring-[#0A2947]">
                      <SelectValue placeholder="Pilih Satuan..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                      {SATUAN_BAHAN_OPTIONS.map((satuan) => (
                        <SelectItem
                          key={satuan}
                          value={satuan}
                          className="cursor-pointer hover:bg-[#0A2947]/5 font-bold"
                        >
                          {satuan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <div className="min-h-4">
                {errors.satuan && (
                  <span className="text-xs font-bold text-rose-500">
                    {errors.satuan.message}
                  </span>
                )}
              </div>
            </div>
            
            <div className="hidden sm:block"></div> {/* Spacer untuk grid */}
            
            {/* Stok Awal */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Stok Awal{" "}
                <span className="text-[#0A2947]/50 font-medium">
                  (Opsional)
                </span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  {...register("stok")}
                  placeholder="0"
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-mono font-bold h-12 pr-16 focus-visible:ring-1 focus-visible:ring-[#0A2947] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0A2947]/40 pointer-events-none">
                  {currentSatuan}
                </div>
              </div>
              <div className="min-h-4">
                {errors.stok && (
                  <span className="text-xs font-bold text-rose-500">
                    {errors.stok.message}
                  </span>
                )}
              </div>
            </div>
            
            {/* Batas Stok Minimum */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Batas Stok Minimum{" "}
                <span className="text-[#0A2947]/50 font-medium">
                  (Opsional)
                </span>
              </label>
              <div className="relative">
                <Input
                  type="number"
                  {...register("minimalStok")}
                  placeholder="0"
                  className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-mono font-bold h-12 pr-16 focus-visible:ring-1 focus-visible:ring-[#0A2947] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0A2947]/40 pointer-events-none">
                  {currentSatuan}
                </div>
              </div>
              <div className="min-h-4">
                {errors.minimalStok && (
                  <span className="text-xs font-bold text-rose-500">
                    {errors.minimalStok.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Helper Text / Tooltip Batas Stok */}
          <div className="flex items-start gap-2 bg-[#0A2947]/5 p-4 rounded-xl border border-[#0A2947]/10 mt-2">
            <Info className="w-5 h-5 text-[#D4A373] shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-[#0A2947]/70 leading-relaxed">
              <strong className="font-bold text-[#0A2947]">
                Integrasi Inventory Otomatis:
              </strong>{" "}
              Bahan baku yang Anda buat akan langsung diteruskan ke tabel <i>Stok Real-time</i> di lokasi <b>{locationName}</b> dengan angka awal yang Anda tentukan di atas.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/outlet/inventaris/bahanBaku")}
              disabled={createMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-11 w-full sm:w-auto px-6"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || isLoadingLokasi || !activeLocationId}
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm h-11 w-full sm:w-auto px-6"
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">Menyimpan...</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="mr-2 h-4 w-4 text-[#D4A373]" /> Simpan Bahan Baku
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}