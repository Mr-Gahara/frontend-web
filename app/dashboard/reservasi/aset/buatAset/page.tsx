"use client";

import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { AsetPayload } from "@/types/aset";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TipeAsetRef } from "@/types/tarif";

// --- Form & Validation ---
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Box, CheckCircle2, Wrench, Layers } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";

// --- ZOD SCHEMA ---
const asetSchema = z.object({
  namaAset: z.string().min(1, "Nama aset wajib diisi"),
  tipeAsetID: z.string().min(1, "Kategori / Tipe aset wajib dipilih"),
  // Status "digunakan" sengaja tidak dimasukkan karena aset baru pasti belum disewa
  status: z.enum(["tersedia", "perbaikan"]).default("tersedia"),
});

type AsetFormInput = z.input<typeof asetSchema>;

export default function BuatAsetPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- REACT HOOK FORM ---
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AsetFormInput>({
    resolver: zodResolver(asetSchema),
    defaultValues: {
      namaAset: "",
      tipeAsetID: "",
      status: "tersedia",
    },
  });

  // --- FETCH DATA TIPE ASET (Untuk Dropdown) ---
  const { data: tipeAsetList = [], isLoading: isLoadingTipeAset } = useQuery<
    TipeAsetRef[]
  >({
    queryKey: queryKeys.tipeAset,
    queryFn: async () => {
      const res = await apiClient.get<{ data: any[] }>(
        "/tipeAset",
        undefined,
        "pengguna",
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000, // Cache 5 menit
  });

  // --- MUTATION CREATE ASET ---
  const createMutation = useMutation<any, Error, AsetPayload>({
    mutationFn: async (payload: AsetPayload) => {
      return await apiClient.post("/aset", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Berhasil", {
        description: "Data aset baru telah ditambahkan.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.aset });
      router.push("/dashboard/reservasi/aset");
    },
    onError: (err: any) => {
      toast.error("Gagal Menyimpan", {
        description: err.message || "Terjadi kesalahan saat menyimpan aset.",
      });
    },
  });

  // --- HANDLER SUBMIT ---
  const onSubmit = (data: AsetFormInput) => {
    const payload: AsetPayload = {
      namaAset: data.namaAset.trim(),
      tipeAsetID: data.tipeAsetID,
      status: data.status as "tersedia" | "perbaikan",
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
          onClick={() => router.push("/dashboard/reservasi/aset")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Aset
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Tambah Aset Baru
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Daftarkan meja, ruangan, atau fasilitas baru yang siap untuk
            disewakan kepada pelanggan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* CARD FORM UTAMA */}
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
            <Box className="h-5 w-5 text-[#D4A373]" />
            <h3 className="text-base font-bold text-[#0A2947]">
              Informasi Detail Aset
            </h3>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Nama Aset / Nomor Meja <span className="text-rose-500">*</span>
            </label>
            <Input
              {...register("namaAset")}
              placeholder="Contoh: Meja Billiard 01, VIP Room A..."
              className={cn(
                "bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] placeholder:text-[#0A2947]/30 focus-visible:ring-1 focus-visible:ring-[#0A2947] h-11",
                errors.namaAset &&
                  "border-rose-500 focus-visible:ring-rose-500",
              )}
            />
            <div className="min-h-4">
              {errors.namaAset ? (
                <span className="text-xs font-bold text-rose-500">
                  {errors.namaAset.message}
                </span>
              ) : (
                <p className="text-[10px] font-medium text-[#0A2947]/50">
                  Identitas unik aset ini agar mudah dikenali oleh kasir dan
                  pelanggan.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#0A2947]/60" />
              Tipe / Kategori Aset <span className="text-rose-500">*</span>
            </label>
            <Controller
              name="tipeAsetID"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                  disabled={isLoadingTipeAset}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold h-11 focus:ring-1 focus:ring-[#0A2947]",
                      errors.tipeAsetID &&
                        "border-rose-500 focus:ring-rose-500",
                    )}
                  >
                    <SelectValue
                      placeholder={
                        isLoadingTipeAset
                          ? "Memuat tipe aset..."
                          : "Pilih kategori tipe aset"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    {tipeAsetList.length === 0 && !isLoadingTipeAset ? (
                      <div className="p-3 text-sm text-center font-medium text-[#0A2947]/60">
                        Belum ada tipe aset. <br /> Buat tipe aset terlebih
                        dahulu.
                      </div>
                    ) : (
                      tipeAsetList.map((tipe) => {
                        const id = tipe.id;
                        return (
                          <SelectItem
                            key={id}
                            value={id}
                            className="cursor-pointer hover:bg-[#0A2947]/5 font-bold"
                          >
                            {tipe.namaTipeAset}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            <div className="min-h-4">
              {errors.tipeAsetID ? (
                <span className="text-xs font-bold text-rose-500">
                  {errors.tipeAsetID.message}
                </span>
              ) : (
                <p className="text-[10px] font-medium text-[#0A2947]/50">
                  Tipe aset menentukan harga/tarif sewa yang akan diberlakukan
                  pada aset ini.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#0A2947]">
              Status Awal
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold h-11 focus:ring-1 focus:ring-[#0A2947]">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                    <SelectItem
                      value="tersedia"
                      className="cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50 text-emerald-700 font-bold"
                    >
                      <div className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Tersedia (Siap
                        Disewa)
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="perbaikan"
                      className="cursor-pointer hover:bg-amber-50 focus:bg-amber-50 text-amber-700 font-bold"
                    >
                      <div className="flex items-center">
                        <Wrench className="w-4 h-4 mr-2" /> Dalam Perbaikan
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-[10px] font-medium text-[#0A2947]/50 pt-1">
              Catatan: Status "Digunakan" akan diatur secara otomatis oleh
              sistem saat transaksi berjalan.
            </p>
          </div>
        </div>

        {/* AKSI TOMBOL */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#0A2947]/10 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/reservasi/aset")}
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
            {createMutation.isPending
              ? "Menyimpan Data..."
              : "Simpan Aset Baru"}
          </Button>
        </div>
      </form>
    </div>
  );
}
