"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { TipeAsetPayload } from "@/types/tipeAset";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Form & Validation ---
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";

// --- ZOD SCHEMA ---
const tipeAsetSchema = z.object({
  namaTipeAset: z
    .string()
    .min(1, "Nama Tipe Aset wajib diisi")
    .min(2, "Nama Tipe Aset minimal 2 karakter"),
  deskripsi: z.string().optional(),
});

type TipeAsetFormInput = z.input<typeof tipeAsetSchema>;

export default function EditTipeAsetPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const rawId = params?.id as string;
  // Proteksi ID tidak valid
  const tipeAsetId = rawId === "undefined" || !rawId ? null : rawId;

  // --- REACT HOOK FORM ---
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TipeAsetFormInput>({
    resolver: zodResolver(tipeAsetSchema),
    defaultValues: {
      namaTipeAset: "",
      deskripsi: "",
    },
  });

  // --- 1. FETCH DATA TIPE ASET LAMA ---
  const {
    data: tipeAsetData,
    isLoading: isLoadingTipeAset,
    isError: isErrorTipeAset,
  } = useQuery({
    queryKey: [...queryKeys.tipeAset, tipeAsetId],
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/tipeAset/${tipeAsetId}`,
        undefined,
        "pengguna",
      );
      return res?.data || res;
    },
    enabled: !!tipeAsetId,
  });

  // --- 2. EFFECT: PRE-FILL FORM KETIKA DATA DIDAPATKAN ---
  useEffect(() => {
    if (tipeAsetData) {
      reset({
        namaTipeAset: tipeAsetData.namaTipeAset || "",
        deskripsi: tipeAsetData.deskripsi || "",
      });
    }
  }, [tipeAsetData, reset]);

  // --- 3. MUTATION UNTUK UPDATE DATA ---
  const updateMutation = useMutation<any, Error, TipeAsetPayload>({
    mutationFn: async (payload: TipeAsetPayload) => {
      return await apiClient.put(
        `/tipeAset/${tipeAsetId}`,
        payload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil Diperbarui", {
        description: "Perubahan Tipe Aset telah tersimpan di sistem.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tipeAset });
      router.push("/dashboard/outlet/reservasi/tipeAset");
    },
    onError: (err: any) => {
      toast.error("Gagal Memperbarui", {
        description:
          err.message || "Terjadi kesalahan saat menyimpan perubahan.",
      });
    },
  });

  // --- HANDLER SUBMIT ---
  const onSubmit = (data: TipeAsetFormInput) => {
    if (!tipeAsetId) return;

    const payload: TipeAsetPayload = {
      namaTipeAset: data.namaTipeAset.trim(),
      deskripsi: data.deskripsi?.trim() || undefined,
    };

    updateMutation.mutate(payload);
  };

  // --- ERROR / LOADING STATES ---
  if (!tipeAsetId) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-[#0A2947]">
          ID Tipe Aset Tidak Valid
        </h2>
        <p className="text-sm font-medium text-[#0A2947]/80">
          Sistem mendeteksi bahwa ID pada URL ini rusak. Silakan kembali ke
          halaman sebelumnya.
        </p>
        <Button
          onClick={() => router.push("/dashboard/outlet/reservasi/tipeAset")}
          className="mt-4 bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Tipe Aset
        </Button>
      </div>
    );
  }

  if (isLoadingTipeAset) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#0A2947]/60" />
        <p className="text-sm font-bold text-[#0A2947]/80">
          Memuat data tipe aset...
        </p>
      </div>
    );
  }

  if (isErrorTipeAset) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-[#0A2947]">
          Data Tidak Ditemukan
        </h2>
        <p className="text-sm font-medium text-[#0A2947]/80">
          Gagal mengambil data tipe aset. Data mungkin sudah dihapus atau server
          sedang bermasalah.
        </p>
        <Button
          onClick={() => router.push("/dashboard/outlet/reservasi/tipeAset")}
          className="mt-4 bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* HEADER & TOMBOL KEMBALI */}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/outlet/reservasi/tipeAset")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Tipe Aset
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Edit Tipe Aset
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Perbarui informasi kategori atau tipe aset untuk menyesuaikan dengan
            kebutuhan operasional.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* CARD FORM UTAMA */}
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <Edit3 className="h-5 w-5 text-[#D4A373]" />
            <h3 className="text-base font-bold text-[#0A2947]">
              Detail Informasi Tipe
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Nama Tipe Aset <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register("namaTipeAset")}
              placeholder="Contoh: Meja Billiard VIP, Lapangan Futsal, dsb."
              className={cn(
                "bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947]",
                errors.namaTipeAset &&
                  "border-rose-500 focus-visible:ring-rose-500",
              )}
            />
            <div className="min-h-4">
              {errors.namaTipeAset ? (
                <span className="text-xs font-bold text-rose-500">
                  {errors.namaTipeAset.message}
                </span>
              ) : (
                <p className="text-[10px] font-medium text-[#0A2947]/50">
                  Nama ini akan muncul pada menu pembuatan aset dan penyewaan.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#0A2947]/50" />
              Deskripsi{" "}
              <span className="text-[#0A2947]/50 font-medium">(Opsional)</span>
            </label>
            <Textarea
              {...register("deskripsi")}
              placeholder="Catatan atau keterangan mengenai tipe aset ini..."
              rows={4}
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947] resize-none"
            />
            <p className="text-[10px] font-medium text-[#0A2947]/50">
              Gunakan untuk menyimpan spesifikasi khusus tipe ini agar staf
              mengetahui perbedaannya.
            </p>
          </div>
        </div>

        {/* AKSI TOMBOL */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#0A2947]/10 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/outlet/reservasi/tipeAset")}
            disabled={updateMutation.isPending || isLoadingTipeAset}
            className="w-full sm:w-auto cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-12 px-8"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending || isLoadingTipeAset}
            className="w-full sm:w-auto cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold h-12 px-8"
          >
            {updateMutation.isPending
              ? "Menyimpan Perubahan..."
              : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
