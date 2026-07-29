"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SATUAN_BAHAN_OPTIONS } from "@/types/bahanBaku";

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
import { ArrowLeft, PackageCheck, Info, Save, Loader2, Ban } from "lucide-react";

// --- ZOD SCHEMA ---
// Stok tetap ada di schema agar bisa di-reset untuk tampilan, tapi tidak akan kita kirim ulang ke backend
const bahanBakuEditSchema = z.object({
  namaBahan: z.string().min(1, "Nama bahan baku wajib diisi"),
  satuan: z.enum(SATUAN_BAHAN_OPTIONS, { message: "Silakan pilih satuan" }),
  stok: z.coerce.number().min(0).default(0),
  minimalStok: z.coerce
    .number()
    .min(0, "Batas stok minimum tidak boleh negatif")
    .default(0),
});

type BahanBakuEditFormInput = z.input<typeof bahanBakuEditSchema>;
type BahanBakuEditFormOutput = z.output<typeof bahanBakuEditSchema>;

export default function EditBahanBakuPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const bahanId = params.id as string;
  const queryClient = useQueryClient();

  // --- FETCH DETAIL DATA ---
  const {
    data: detailBahan,
    isLoading: isLoadingDetail,
    isError: isErrorDetail,
  } = useQuery({
    queryKey: [...queryKeys.bahanBaku, "detail", bahanId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>(`/bahan-baku/${bahanId}`, undefined, "pengguna");
        return res.data?.data || res.data;
      } catch (error) {
        // Fallback endpoint camelCase
        const res = await apiClient.get<any>(`/bahanBaku/${bahanId}`, undefined, "pengguna");
        return res.data?.data || res.data;
      }
    },
    enabled: !!bahanId,
  });

  // --- REACT HOOK FORM ---
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<BahanBakuEditFormInput, any, BahanBakuEditFormOutput>({
    resolver: zodResolver(bahanBakuEditSchema),
    defaultValues: {
      namaBahan: "",
      satuan: "gram",
      stok: 0,
      minimalStok: 0,
    },
  });

  const currentSatuan = useWatch({ control, name: "satuan" });

  // Sinkronisasi data ke form saat selesai fetch
  useEffect(() => {
    if (detailBahan) {
      reset({
        namaBahan: detailBahan.namaBahan || "",
        satuan: detailBahan.satuan || "gram",
        stok: detailBahan.stok || 0,
        minimalStok: detailBahan.minimalStok || 0,
      });
    }
  }, [detailBahan, reset]);

  // --- MUTATION UPDATE ---
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<BahanBakuEditFormOutput>) => {
      try {
        return await apiClient.put(`/bahan-baku/${bahanId}`, payload, undefined, "pengguna");
      } catch (error) {
        return await apiClient.put(`/bahanBaku/${bahanId}`, payload, undefined, "pengguna");
      }
    },
    onSuccess: () => {
      toast.success("Berhasil Diperbarui", {
        description: "Perubahan master data bahan baku telah disimpan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bahanBaku });
      queryClient.invalidateQueries({ queryKey: ["inventory"] }); // Update tabel stok
      router.push("/dashboard/outlet/inventaris/bahanBaku");
    },
    onError: (err: any) => {
      toast.error("Gagal Memperbarui", {
        description: err.message || "Terjadi kesalahan saat menyimpan data.",
      });
    },
  });

  // --- HANDLER SUBMIT ---
  const onSubmit = (data: BahanBakuEditFormOutput) => {
    // Kita BUANG property 'stok' dari payload agar tidak menimpa stok yang sedang berjalan di backend.
    const { stok, ...safePayload } = data;
    updateMutation.mutate(safePayload);
  };

  // --- RENDER CONDITIONS ---
  if (isLoadingDetail) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A2947]/60" />
        <p className="text-sm font-bold text-[#0A2947]/60">Memuat data bahan baku...</p>
      </div>
    );
  }

  if (isErrorDetail || !detailBahan) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-[#0A2947]">
        <Ban className="h-10 w-10 text-rose-500" />
        <p className="font-bold">Data bahan baku tidak ditemukan.</p>
        <Button onClick={() => router.push("/dashboard/outlet/inventaris/bahanBaku")} variant="outline">
          Kembali ke Daftar
        </Button>
      </div>
    );
  }

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
            Edit Bahan Baku
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Perbarui informasi master data bahan baku.
          </p>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] shadow-sm overflow-hidden">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6 p-6 sm:p-8"
        >
          <div className="flex items-center gap-2 mb-2 border-b border-[#0A2947]/10 pb-4">
            <PackageCheck className="h-5 w-5 text-[#D4A373]" />
            <h3 className="text-base font-bold text-[#0A2947]">
              Informasi Dasar
            </h3>
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
                    value={field.value}
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
            
            {/* Stok Aktual (Read-Only) */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Stok Global Saat Ini
              </label>
              <div className="relative">
                <Input
                  type="number"
                  {...register("stok")}
                  disabled
                  className="bg-[#0A2947]/5 border-[#0A2947]/10 text-[#0A2947]/60 font-mono font-bold h-12 pr-16 disabled:cursor-not-allowed disabled:opacity-100"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0A2947]/40 pointer-events-none">
                  {currentSatuan}
                </div>
              </div>
            </div>
            
            {/* Batas Stok Minimum */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Batas Stok Minimum <span className="text-red-500">*</span>
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

          {/* Helper Text Mengapa Stok Di-disable */}
          <div className="flex items-start gap-2 bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs font-medium text-blue-800 leading-relaxed">
              <strong className="font-bold">Kenapa Stok tidak bisa diubah di sini?</strong>
              <p className="mt-1">
                Sesuai standar operasional, angka stok fisik harus dijaga integritasnya. Jika Anda menemukan selisih atau ingin mengubah angka stok yang sedang berjalan, gunakan menu <span className="font-bold text-blue-900 cursor-pointer hover:underline" onClick={() => router.push("/dashboard/outlet/inventaris/stok")}>Stok Real-time (Quick Opname)</span> agar perubahan tersebut tercatat di Jurnal Stok.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-[#0A2947]/10 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/outlet/inventaris/bahanBaku")}
              disabled={updateMutation.isPending}
              className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-11 w-full sm:w-auto px-6"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
              className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm h-11 w-full sm:w-auto px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="mr-2 h-4 w-4 text-[#D4A373]" /> Simpan Perubahan
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}