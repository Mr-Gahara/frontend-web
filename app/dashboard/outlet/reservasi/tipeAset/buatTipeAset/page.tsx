"use client";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { TipeAsetPayload } from "@/types/tipeAset";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Form & Validation ---
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Pastikan komponen ini ada sesuai tree Anda
import {
  ArrowLeft,
  Layers,
  FileText,
} from "lucide-react";

// --- ZOD SCHEMA ---
const tipeAsetSchema = z.object({
  namaTipeAset: z
    .string()
    .min(1, "Nama Kategori Aset wajib diisi")
    .min(2, "Nama Kategori Aset minimal 2 karakter"), // Menyesuaikan validasi backend
  deskripsi: z.string().optional(),
});

type TipeAsetFormInput = z.input<typeof tipeAsetSchema>;

export default function BuatTipeAsetPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- REACT HOOK FORM ---
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TipeAsetFormInput>({
    resolver: zodResolver(tipeAsetSchema),
    defaultValues: {
      namaTipeAset: "",
      deskripsi: "",
    },
  });

  // --- MUTATION CREATE TIPE ASET ---
  const createMutation = useMutation<any, Error, TipeAsetPayload>({
    mutationFn: async (payload: TipeAsetPayload) => {
      // Menggunakan endpoint /tipe-aset sesuai standar REST backend Anda
      return await apiClient.post("/tipeAset", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Kategori Aset baru berhasil ditambahkan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tipeAset });
      router.push("/dashboard/outlet/reservasi/tipeAset");
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan", {
        description: err.message || "Gagal menambahkan Kategori Aset baru.",
      });
    },
  });

  // --- HANDLER SUBMIT ---
  const onSubmit = (data: TipeAsetFormInput) => {
    // Sanitasi data opsional
    const payload: TipeAsetPayload = {
      namaTipeAset: data.namaTipeAset.trim(),
      deskripsi: data.deskripsi?.trim() || undefined,
    };

    createMutation.mutate(payload);
  };

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
          Kembali ke Daftar Kategori Aset
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Tambah Kategori Aset Baru
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Buat kategori atau tipe baru untuk mengelompokkan aset/fasilitas yang Anda sewakan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* CARD FORM UTAMA */}
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <Layers className="h-5 w-5 text-[#D4A373]" />
            <h3 className="text-base font-bold text-[#0A2947]">
              Detail Informasi Kategori Aset
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Nama Kategori Aset <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register("namaTipeAset")}
              placeholder="Contoh: Meja Billiard VIP, Lapangan Futsal, dsb."
              className={cn(
                "bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947]",
                errors.namaTipeAset && "border-rose-500 focus-visible:ring-rose-500"
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
              Deskripsi <span className="text-[#0A2947]/50 font-medium">(Opsional)</span>
            </label>
            <Textarea
              {...register("deskripsi")}
              placeholder="Catatan atau keterangan mengenai tipe aset ini..."
              rows={4}
              className="bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947] resize-none"
            />
            <p className="text-[10px] font-medium text-[#0A2947]/50">
              Gunakan untuk menyimpan spesifikasi khusus kategori ini agar staf mengetahui perbedaannya.
            </p>
          </div>
        </div>

        {/* AKSI TOMBOL */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#0A2947]/10 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/outlet/reservasi/tipeAset")}
            disabled={createMutation.isPending}
            className="w-full sm:w-auto cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold h-12 px-8"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full sm:w-auto cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold h-12 px-8"
          >
            {createMutation.isPending ? "Menyimpan Data..." : "Simpan Kategori Aset"}
          </Button>
        </div>
      </form>
    </div>
  );
}