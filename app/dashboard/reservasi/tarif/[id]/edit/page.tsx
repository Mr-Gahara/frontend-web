"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Tarif, TarifPayload, TipeAsetRef } from "@/types/tarif";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Clock,
  CalendarDays,
  Tags,
  Loader2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

// --- CONSTANTS ---
const HARI_MAP = [
  { id: 0, label: "Minggu" },
  { id: 1, label: "Senin" },
  { id: 2, label: "Selasa" },
  { id: 3, label: "Rabu" },
  { id: 4, label: "Kamis" },
  { id: 5, label: "Jumat" },
  { id: 6, label: "Sabtu" },
];

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// --- ZOD SCHEMA ---
const tarifSchema = z
  .object({
    namaTarif: z.string().min(1, "Nama tarif wajib diisi"),
    basisPerhitungan: z.enum(["per jam", "per sesi"]),
    harga: z.coerce.number().min(0, "Harga tidak boleh negatif"),
    durasiMinimum: z.coerce.number().min(1, "Durasi minimum minimal 1"),
    isActive: z.boolean().default(true),
    hariAktif: z.array(z.number()).default([]),
    jamMulai: z.string().optional(),
    jamSelesai: z.string().optional(),
    prioritas: z.coerce.number().min(1, "Prioritas minimal 1").default(1),
    tipeAsetID: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.jamMulai && !TIME_REGEX.test(data.jamMulai)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Format harus HH:mm",
        path: ["jamMulai"],
      });
    }
    if (data.jamSelesai && !TIME_REGEX.test(data.jamSelesai)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Format harus HH:mm",
        path: ["jamSelesai"],
      });
    }
    if (
      data.jamMulai &&
      data.jamSelesai &&
      TIME_REGEX.test(data.jamMulai) &&
      TIME_REGEX.test(data.jamSelesai)
    ) {
      if (data.jamMulai >= data.jamSelesai) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jam mulai harus lebih awal dari jam selesai",
          path: ["jamMulai"],
        });
      }
    }
  });

type TarifFormInput = z.input<typeof tarifSchema>;
type TarifFormOutput = z.output<typeof tarifSchema>;

export default function EditTarifPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id as string;

  // Proteksi ID tidak valid
  const tarifId = rawId === "undefined" || !rawId ? null : rawId;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TarifFormInput, any, TarifFormOutput>({
    resolver: zodResolver(tarifSchema),
    defaultValues: {
      namaTarif: "",
      basisPerhitungan: "per jam",
      harga: 0,
      durasiMinimum: 1,
      isActive: true,
      hariAktif: [0, 1, 2, 3, 4, 5, 6],
      jamMulai: "00:00",
      jamSelesai: "23:59",
      prioritas: 1,
      tipeAsetID: [],
    },
  });

  // --- 1. FETCH DATA TARIF LAMA ---
  const {
    data: tarifData,
    isLoading: isLoadingTarif,
    isError: isErrorTarif,
  } = useQuery({
    queryKey: queryKeys.tarifDetail(tarifId!),
    queryFn: async () => {
      const res = await apiClient.get<any>(
        `/tarif/${tarifId}`,
        undefined,
        "pengguna",
      );
      return res?.data || res;
    },
    enabled: !!tarifId,
  });

  // --- 2. PRE-FILL FORM KETIKA DATA DIDAPATKAN ---
  useEffect(() => {
    if (tarifData) {
      const mappedTipeAset: string[] =
        tarifData.dataAset
          ?.map((aset: any) => String(aset.id || ""))
          .filter(Boolean) || [];

      reset({
        namaTarif: tarifData.namaTarif || "",
        basisPerhitungan: tarifData.basisPerhitungan || "per jam",
        harga: tarifData.harga ?? 0,
        durasiMinimum: tarifData.durasiMinimum ?? 1,
        isActive: tarifData.isActive ?? true,
        hariAktif: tarifData.hariAktif || [],
        jamMulai: tarifData.jamMulai || "00:00",
        jamSelesai: tarifData.jamSelesai || "23:59",
        prioritas: tarifData.prioritas ?? 1,
        tipeAsetID: mappedTipeAset,
      });
    }
  }, [tarifData, reset]);

  // --- 3. FETCH TIPE ASET LIST ---
  const { data: tipeAsetList = [], isLoading: isLoadingAset } = useQuery<
    TipeAsetRef[]
  >({
    queryKey: queryKeys.tipeAset,
    queryFn: async () => {
      const res = await apiClient.get<{ data: TipeAsetRef[] }>(
        "/tipeAset",
        undefined,
        "pengguna",
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // --- 4. MUTATION UNTUK UPDATE DATA ---
  const updateMutation = useMutation<Tarif, Error, TarifPayload>({
    mutationFn: async (payload: TarifPayload) => {
      return await apiClient.put(
        `/tarif/${tarifId}`,
        payload,
        undefined,
        "pengguna",
      );
    },
    onSuccess: () => {
      toast.success("Berhasil Diperbarui", {
        description: "Perubahan data tarif telah tersimpan di sistem.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tarif });
      router.push("/dashboard/reservasi/tarif");
    },
    onError: (error: any) => {
      toast.error("Gagal Memperbarui", {
        description: error.message || "Terjadi kesalahan saat menyimpan data.",
      });
    },
  });

  const onSubmit = (data: TarifFormOutput) => {
    if (!tarifId) return;
    const payload: TarifPayload = { ...data };
    updateMutation.mutate(payload);
  };

  // --- ERROR / LOADING STATES ---
  if (!tarifId) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-[#0A2947]">
          ID Tarif Tidak Valid
        </h2>
        <p className="text-sm font-medium text-[#0A2947]/80">
          Sistem mendeteksi bahwa ID tarif pada URL ini rusak atau "undefined".
        </p>
        <Button
          onClick={() => router.push("/dashboard/reservasi/tarif")}
          className="mt-4 bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Daftar Tarif
        </Button>
      </div>
    );
  }

  if (isLoadingTarif) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#0A2947]" />
        <p className="text-sm font-bold text-[#0A2947]/80">
          Memuat data tarif...
        </p>
      </div>
    );
  }

  if (isErrorTarif) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-[#0A2947]">
          Data Tidak Ditemukan
        </h2>
        <p className="text-sm font-medium text-[#0A2947]/80">
          Gagal mengambil data tarif. Data mungkin sudah dihapus atau server
          sedang bermasalah.
        </p>
        <Button
          onClick={() => router.push("/dashboard/reservasi/tarif")}
          className="mt-4 bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold transition-colors"
          onClick={() => router.push("/dashboard/reservasi/tarif")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Daftar Tarif
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Edit Tarif
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Perbarui konfigurasi harga, durasi, dan jadwal berlakunya tarif.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm flex flex-col gap-8">
          {/* SECTION 1: INFO DASAR */}
          <div className="rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <Tags className="w-5 h-5 text-[#D4A373]" />
              <h3 className="font-bold text-base text-[#0A2947]">
                Informasi Dasar
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Nama Tarif <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...register("namaTarif")}
                  placeholder="Misal: Tarif Malam Minggu, Tarif VIP..."
                  className={cn(
                    "bg-white border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947]",
                    errors.namaTarif && "border-rose-500",
                  )}
                />
                <div className="min-h-4">
                  {errors.namaTarif && (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.namaTarif.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Prioritas (Order)
                </label>
                <Input
                  type="number"
                  {...register("prioritas")}
                  className={cn(
                    "bg-white border-[#0A2947]/20 text-[#0A2947] focus-visible:ring-[#0A2947] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                    errors.prioritas && "border-rose-500",
                  )}
                />
                <div className="min-h-4 flex flex-col justify-start">
                  {errors.prioritas ? (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.prioritas.message}
                    </span>
                  ) : (
                    <p className="text-[11px] font-medium text-[#0A2947]/60">
                      Semakin tinggi angka, semakin diprioritaskan jika bentrok.
                    </p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 p-4 rounded-xl border border-[#718355]/30 bg-[#718355]/5">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(val) => field.onChange(val === true)}
                      className="data-[state=checked]:bg-[#718355] data-[state=checked]:border-[#718355] data-[state=checked]:text-[#FFFAF3] border-[#0A2947]/30"
                    />
                  )}
                />
                <div className="space-y-0.5">
                  <label
                    className="text-sm font-bold text-[#0A2947] cursor-pointer"
                    onClick={() =>
                      setValue("isActive", !control._formValues.isActive)
                    }
                  >
                    Aktifkan Tarif Ini
                  </label>
                  <p className="text-xs font-medium text-[#0A2947]/70">
                    Tarif dapat langsung digunakan untuk transaksi booking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ATURAN HARGA */}
          <div className="rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <Clock className="w-5 h-5 text-[#D4A373]" />
              <h3 className="font-bold text-base text-[#0A2947]">
                Aturan Harga & Durasi
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Basis Perhitungan <span className="text-rose-500">*</span>
                </label>
                <Controller
                  name="basisPerhitungan"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full bg-white border-[#0A2947]/20 text-[#0A2947] font-bold h-10 focus:ring-1 focus:ring-[#0A2947]">
                        <SelectValue placeholder="Pilih Basis" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#0A2947]/10 text-[#0A2947]">
                        <SelectItem
                          value="per jam"
                          className="font-bold cursor-pointer hover:bg-[#0A2947]/5"
                        >
                          Per Jam
                        </SelectItem>
                        <SelectItem
                          value="per sesi"
                          className="font-bold cursor-pointer hover:bg-[#0A2947]/5"
                        >
                          Per Sesi
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Harga (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Controller
                    name="harga"
                    control={control}
                    render={({ field }) => {
                      const numericValue = Number(field.value) || 0;
                      const displayValue =
                        numericValue === 0
                          ? ""
                          : new Intl.NumberFormat("id-ID").format(numericValue);
                      return (
                        <Input
                          placeholder="0"
                          value={displayValue}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            field.onChange(raw ? Number(raw) : 0);
                          }}
                          className={cn(
                            "bg-white border-[#0A2947]/20 text-[#0A2947] font-mono font-bold pl-9 focus-visible:ring-[#0A2947]",
                            errors.harga && "border-rose-500",
                          )}
                          inputMode="numeric"
                        />
                      );
                    }}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#0A2947]/60 pointer-events-none">
                    Rp
                  </span>
                </div>
                <div className="min-h-4">
                  {errors.harga && (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.harga.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#0A2947]">
                  Durasi Minimum <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    {...register("durasiMinimum")}
                    className={cn(
                      "bg-white border-[#0A2947]/20 text-[#0A2947] font-bold focus-visible:ring-[#0A2947] pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      errors.durasiMinimum && "border-rose-500",
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0A2947]/60 pointer-events-none">
                    menit
                  </span>
                </div>
                <div className="min-h-4">
                  {errors.durasiMinimum && (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.durasiMinimum.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: JADWAL BERLAKU */}
          <div className="rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <CalendarDays className="w-5 h-5 text-[#D4A373]" />
              <h3 className="font-bold text-base text-[#0A2947]">
                Jadwal Berlaku
              </h3>
            </div>

            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-[#0A2947]">
                  Hari Aktif
                </label>
                <div className="flex flex-wrap gap-4">
                  <Controller
                    name="hariAktif"
                    control={control}
                    render={({ field }) => (
                      <>
                        {HARI_MAP.map((hari) => {
                          const values = field.value ?? [];
                          const isChecked = values.includes(hari.id);
                          return (
                            <label
                              key={hari.id}
                              className="flex items-center gap-2 cursor-pointer bg-white border border-[#0A2947]/10 py-2 px-3 rounded-lg hover:bg-[#0A2947]/5 transition-colors"
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked === true) {
                                    field.onChange([...values, hari.id]);
                                  } else {
                                    field.onChange(
                                      values.filter((val) => val !== hari.id),
                                    );
                                  }
                                }}
                                className="data-[state=checked]:bg-[#718355] data-[state=checked]:border-[#718355] data-[state=checked]:text-[#FFFAF3] border-[#0A2947]/30"
                              />
                              <span className="text-sm font-bold text-[#0A2947]">
                                {hari.label}
                              </span>
                            </label>
                          );
                        })}
                      </>
                    )}
                  />
                </div>
                {errors.hariAktif && (
                  <span className="text-xs font-bold text-rose-500 block">
                    {errors.hariAktif.message}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-[#0A2947]">
                  Rentang Waktu Berlaku
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                  <Controller
                    name="jamMulai"
                    control={control}
                    render={({ field }) => {
                      const hourVal = field.value
                        ? field.value.split(":")[0]
                        : "00";
                      const minuteVal = field.value
                        ? field.value.split(":")[1]
                        : "00";
                      return (
                        <div
                          className={cn(
                            "flex h-11 w-full flex-1 items-center justify-center gap-1.5 rounded-md border border-[#0A2947]/20 bg-white px-3 focus-within:ring-1 focus-within:ring-[#0A2947] transition-shadow shadow-sm",
                            errors.jamMulai && "border-rose-500",
                          )}
                        >
                          <Clock className="h-4 w-4 mr-1 text-[#D4A373]" />
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="00"
                            className="w-7 bg-transparent text-center font-bold text-[#0A2947] outline-none"
                            value={hourVal}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              field.onChange(`${val}:${minuteVal}`);
                            }}
                            onBlur={(e) => {
                              let val = e.target.value.padStart(2, "0");
                              if (parseInt(val) > 23) val = "23";
                              field.onChange(`${val}:${minuteVal}`);
                            }}
                          />
                          <span className="font-bold text-[#0A2947]">:</span>
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="00"
                            className="w-7 bg-transparent text-center font-bold text-[#0A2947] outline-none"
                            value={minuteVal}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              field.onChange(`${hourVal}:${val}`);
                            }}
                            onBlur={(e) => {
                              let val = e.target.value.padStart(2, "0");
                              if (parseInt(val) > 59) val = "59";
                              field.onChange(`${hourVal}:${val}`);
                            }}
                          />
                        </div>
                      );
                    }}
                  />
                  <span className="text-sm font-bold hidden sm:block shrink-0 text-[#0A2947]/50">
                    s/d
                  </span>
                  <Controller
                    name="jamSelesai"
                    control={control}
                    render={({ field }) => {
                      const hourVal = field.value
                        ? field.value.split(":")[0]
                        : "00";
                      const minuteVal = field.value
                        ? field.value.split(":")[1]
                        : "00";
                      return (
                        <div
                          className={cn(
                            "flex h-11 w-full flex-1 items-center justify-center gap-1.5 rounded-md border border-[#0A2947]/20 bg-white px-3 focus-within:ring-1 focus-within:ring-[#0A2947] transition-shadow shadow-sm",
                            errors.jamSelesai && "border-rose-500",
                          )}
                        >
                          <Clock className="h-4 w-4 mr-1 text-[#D4A373]" />
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="00"
                            className="w-7 bg-transparent text-center font-bold text-[#0A2947] outline-none"
                            value={hourVal}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              field.onChange(`${val}:${minuteVal}`);
                            }}
                            onBlur={(e) => {
                              let val = e.target.value.padStart(2, "0");
                              if (parseInt(val) > 23) val = "23";
                              field.onChange(`${val}:${minuteVal}`);
                            }}
                          />
                          <span className="font-bold text-[#0A2947]">:</span>
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="00"
                            className="w-7 bg-transparent text-center font-bold text-[#0A2947] outline-none"
                            value={minuteVal}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              field.onChange(`${hourVal}:${val}`);
                            }}
                            onBlur={(e) => {
                              let val = e.target.value.padStart(2, "0");
                              if (parseInt(val) > 59) val = "59";
                              field.onChange(`${hourVal}:${val}`);
                            }}
                          />
                        </div>
                      );
                    }}
                  />
                </div>
                {(errors.jamMulai || errors.jamSelesai) && (
                  <div className="flex flex-col gap-1 min-h-4 pt-1">
                    {errors.jamMulai && (
                      <span className="text-xs font-bold text-rose-500">
                        Mulai: {errors.jamMulai.message}
                      </span>
                    )}
                    {errors.jamSelesai && (
                      <span className="text-xs font-bold text-rose-500">
                        Selesai: {errors.jamSelesai.message}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: ASET TERKAIT */}
          <div className="rounded-xl border border-[#0A2947]/10 bg-[#FFFAF3] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3">
              <AlertCircle className="w-5 h-5 text-[#D4A373]" />
              <h3 className="font-bold text-base text-[#0A2947]">
                Tipe Aset Terkait (Opsional)
              </h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#0A2947]/80">
                Pilih tipe aset mana saja yang menggunakan tarif ini. Kosongkan
                jika tarif ini berlaku untuk <b>Semua Aset</b>.
              </p>
              {isLoadingAset ? (
                <div className="text-sm font-bold italic text-[#0A2947]/60">
                  Memuat daftar aset...
                </div>
              ) : tipeAsetList.length === 0 ? (
                <div className="text-sm font-bold italic text-[#0A2947]/60">
                  Belum ada data tipe aset di sistem.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  <Controller
                    name="tipeAsetID"
                    control={control}
                    render={({ field }) => (
                      <>
                        {tipeAsetList.map(
                          (aset: TipeAsetRef, index: number) => {
                            // FIX: Bypass TypeScript strict type dan tangkap id dari mapper
                            const validId = aset.id;

                            const values = field.value ?? [];
                            // Pastikan validId ada sebelum mengecek includes
                            const isChecked = validId
                              ? values.includes(validId)
                              : false;

                            return (
                              <label
                                key={validId || index} // Fallback UI key saja
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                  isChecked
                                    ? "bg-white shadow-sm border-[#0A2947]"
                                    : "hover:bg-black/5 border-[#0A2947]/15",
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    // Cegah error fatal: Jangan simpan jika ID tidak sah dari backend
                                    if (!validId) return;

                                    if (checked === true) {
                                      field.onChange([...values, validId]);
                                    } else {
                                      field.onChange(
                                        values.filter((val) => val !== validId),
                                      );
                                    }
                                  }}
                                  className="mt-0.5 data-[state=checked]:bg-[#0A2947] data-[state=checked]:border-[#0A2947] data-[state=checked]:text-[#FFFAF3]"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-[#0A2947]">
                                    {aset.namaTipeAset}
                                  </span>
                                </div>
                              </label>
                            );
                          },
                        )}
                      </>
                    )}
                  />
                </div>
              )}
              {errors.tipeAsetID && (
                <p className="text-xs font-bold text-rose-500 pt-2">
                  Data tipe aset tidak valid.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-[#0A2947]/10 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/reservasi/tarif")}
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto font-bold border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 h-12 px-8 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto font-bold shadow-md bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 h-12 px-8 cursor-pointer"
          >
            {updateMutation.isPending ? (
              <span className="flex items-center gap-2">Menyimpan...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Simpan Perubahan
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
