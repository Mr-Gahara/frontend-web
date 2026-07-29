"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { Tarif, TarifPayload, TipeAsetRef } from "@/types/tarif";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Save,
  Clock,
  CalendarDays,
  Tags,
  AlertCircle,
} from "lucide-react";

// --- COLORS (Design Tokens) ---
const COLORS = {
  navy: "#0A2947",
  cream: "#FFFAF3",
  darkCream: "#F2EAE1",
  gold: "#D4A373",
  sage: "#718355",
  rose: "#F43F5E",
};

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

export default function BuatTarifPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TarifFormInput, any, TarifFormOutput>({
    resolver: zodResolver(tarifSchema),
    defaultValues: {
      namaTarif: "",
      basisPerhitungan: "per jam",
      harga: "",
      durasiMinimum: 1,
      isActive: true,
      hariAktif: [0, 1, 2, 3, 4, 5, 6],
      jamMulai: "00:00",
      jamSelesai: "23:59",
      prioritas: 1,
      tipeAsetID: [],
    },
  });

  const basisPerhitungan = useWatch({ control, name: "basisPerhitungan" });

  const {
    data: tipeAsetList = [],
    isLoading: isLoadingAset,
    isError: isErrorAset,
  } = useQuery<TipeAsetRef[]>({
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

  const createMutation = useMutation<Tarif, Error, TarifPayload>({
    mutationFn: async (payload: TarifPayload) => {
      return await apiClient.post("/tarif", payload, undefined, "pengguna");
    },
    onSuccess: () => {
      toast.success("Tarif Berhasil Dibuat", {
        description: "Data tarif baru telah tersimpan di sistem.",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tarif });
      router.push("/dashboard/outlet/reservasi/tarif");
    },
    onError: (error: any) => {
      toast.error("Gagal Menyimpan", {
        description: error.message || "Terjadi kesalahan saat menyimpan data.",
      });
    },
  });

  const onSubmit = (data: TarifFormOutput) => {
    const payload: TarifPayload = {
      ...data,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/outlet/reservasi/tarif")}
            className="rounded-full transition-colors hover:bg-[#F2EAE1]"
            style={{ color: COLORS.navy }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <h2
              className="text-xl font-bold tracking-tight"
              style={{ color: COLORS.navy }}
            >
              Buat Tarif Baru
            </h2>
            <p
              className="text-sm font-medium"
              style={{ color: `${COLORS.navy}80` }}
            >
              Konfigurasi harga, durasi, dan jadwal berlakunya tarif.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div
          className="rounded-2xl p-5 sm:p-8 border shadow-sm flex flex-col gap-8"
          style={{
            background: COLORS.darkCream,
            borderColor: `${COLORS.navy}15`,
          }}
        >
          {/* SECTION 1: INFO DASAR */}
          <div
            className="rounded-xl p-6 border shadow-sm flex flex-col gap-5"
            style={{
              background: COLORS.cream,
              borderColor: `${COLORS.navy}10`,
            }}
          >
            <div
              className="flex items-center gap-2 border-b pb-3"
              style={{ borderColor: `${COLORS.navy}10` }}
            >
              <Tags className="w-5 h-5" style={{ color: COLORS.gold }} />
              <h3
                className="font-bold text-base"
                style={{ color: COLORS.navy }}
              >
                Informasi Dasar
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  className="text-sm font-bold"
                  style={{ color: COLORS.navy }}
                >
                  Nama Tarif <span className="text-rose-500">*</span>
                </label>
                <Input
                  {...register("namaTarif")}
                  placeholder="Misal: Tarif Malam Minggu, Tarif VIP..."
                  className="bg-white border-gray-200 focus-visible:ring-1"
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
                <label
                  className="text-sm font-bold"
                  style={{ color: COLORS.navy }}
                >
                  Prioritas (Order)
                </label>
                <Input
                  type="number"
                  {...register("prioritas")}
                  className="bg-white border-gray-200 focus-visible:ring-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="min-h-4 flex flex-col justify-start">
                  {errors.prioritas ? (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.prioritas.message}
                    </span>
                  ) : (
                    <p
                      className="text-[11px] font-medium"
                      style={{ color: `${COLORS.navy}70` }}
                    >
                      Semakin tinggi angka, semakin diprioritaskan jika bentrok.
                    </p>
                  )}
                </div>
              </div>

              <div
                className="sm:col-span-2 flex items-center gap-3 p-3 rounded-lg border"
                style={{
                  background: `${COLORS.sage}10`,
                  borderColor: `${COLORS.sage}30`,
                }}
              >
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(val) => field.onChange(val === true)}
                      className="data-[state=checked]:bg-[#718355] data-[state=checked]:border-[#718355] data-[state=checked]:text-[#FFFAF3]"
                    />
                  )}
                />
                <div className="space-y-0.5">
                  <label
                    className="text-sm font-bold"
                    style={{ color: COLORS.navy }}
                  >
                    Aktifkan Tarif Ini
                  </label>
                  <p
                    className="text-xs font-medium"
                    style={{ color: `${COLORS.navy}80` }}
                  >
                    Tarif dapat langsung digunakan untuk transaksi booking.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: ATURAN HARGA */}
          <div
            className="rounded-xl p-6 border shadow-sm flex flex-col gap-5"
            style={{
              background: COLORS.cream,
              borderColor: `${COLORS.navy}10`,
            }}
          >
            <div
              className="flex items-center gap-2 border-b pb-3"
              style={{ borderColor: `${COLORS.navy}10` }}
            >
              <Clock className="w-5 h-5" style={{ color: COLORS.gold }} />
              <h3
                className="font-bold text-base"
                style={{ color: COLORS.navy }}
              >
                Aturan Harga & Durasi
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label
                  className="text-sm font-bold"
                  style={{ color: COLORS.navy }}
                >
                  Basis Perhitungan <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register("basisPerhitungan")}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-1 focus:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: COLORS.navy }}
                >
                  <option value="per jam">Per Jam</option>
                  <option value="per sesi">Per Sesi</option>
                </select>
                <div className="min-h-4">
                  {errors.basisPerhitungan && (
                    <span className="text-xs font-bold text-rose-500">
                      {errors.basisPerhitungan.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-bold"
                  style={{ color: COLORS.navy }}
                >
                  Harga <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                    style={{ color: `${COLORS.navy}60` }}
                  >
                    Rp
                  </span>
                  <Input
                    type="number"
                    {...register("harga")}
                    placeholder="0"
                    className="bg-white border-gray-200 focus-visible:ring-1 font-bold pl-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
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
                <label
                  className="text-sm font-bold"
                  style={{ color: COLORS.navy }}
                >
                  Durasi Minimum <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    {...register("durasiMinimum")}
                    className="bg-white border-gray-200 focus-visible:ring-1 pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                    style={{ color: `${COLORS.navy}60` }}
                  >
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
          <div
            className="rounded-xl p-6 border shadow-sm flex flex-col gap-5"
            style={{
              background: COLORS.cream,
              borderColor: `${COLORS.navy}10`,
            }}
          >
            <div
              className="flex items-center gap-2 border-b pb-3"
              style={{ borderColor: `${COLORS.navy}10` }}
            >
              <CalendarDays
                className="w-5 h-5"
                style={{ color: COLORS.gold }}
              />
              <h3
                className="font-bold text-base"
                style={{ color: COLORS.navy }}
              >
                Jadwal Berlaku
              </h3>
            </div>

            <div className="flex flex-col gap-6">
              <div className="space-y-3">
                <label
                  className="text-sm font-bold"
                  style={{ color: COLORS.navy }}
                >
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
                              className="flex items-center gap-2 cursor-pointer"
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
                                className="data-[state=checked]:bg-[#0A2947] data-[state=checked]:border-[#0A2947] data-[state=checked]:text-[#FFFAF3]"
                              />
                              <span
                                className="text-sm font-semibold"
                                style={{ color: COLORS.navy }}
                              >
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

              {/* FIX UI JAM: Menggunakan text input kustom format 24 jam dengan controller untuk merakit string HH:mm */}
              <div className="space-y-3">
                <label
                  className="text-sm font-bold"
                  style={{ color: COLORS.navy }}
                >
                  Rentang Waktu Berlaku
                </label>
                <div className="flex justify-between flex-col py-4 sm:flex-row sm:items-center gap-4 w-full">
                  {/* JAM MULAI */}
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
                        <div className="flex h-10 w-full flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 focus-within:ring-1 focus-within:ring-gray-950 transition-shadow shadow-sm">
                          <Clock
                            className="h-4 w-4 mr-1"
                            style={{ color: COLORS.gold }}
                          />
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

                  <span
                    className="text-sm font-bold hidden sm:block shrink-0"
                    style={{ color: `${COLORS.navy}50` }}
                  >
                    s/d
                  </span>

                  {/* JAM SELESAI */}
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
                        <div className="flex h-10 w-full flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 focus-within:ring-1 focus-within:ring-gray-950 transition-shadow shadow-sm">
                          <Clock
                            className="h-4 w-4 mr-1"
                            style={{ color: COLORS.gold }}
                          />
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

                {/* ERROR JAM TERPUSAT */}
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
          <div
            className="rounded-xl p-6 border shadow-sm flex flex-col gap-5"
            style={{
              background: COLORS.cream,
              borderColor: `${COLORS.navy}10`,
            }}
          >
            <div
              className="flex items-center gap-2 border-b pb-3"
              style={{ borderColor: `${COLORS.navy}10` }}
            >
              <AlertCircle className="w-5 h-5" style={{ color: COLORS.gold }} />
              <h3
                className="font-bold text-base"
                style={{ color: COLORS.navy }}
              >
                Tipe Aset Terkait (Opsional)
              </h3>
            </div>

            <div className="space-y-3">
              <p
                className="text-sm font-medium"
                style={{ color: `${COLORS.navy}80` }}
              >
                Pilih tipe aset mana saja yang menggunakan tarif ini. Kosongkan
                jika tarif ini berlaku untuk <b>Semua Aset</b>.
              </p>

              {isLoadingAset ? (
                <div
                  className="text-sm font-bold italic"
                  style={{ color: `${COLORS.navy}60` }}
                >
                  Memuat daftar aset...
                </div>
              ) : tipeAsetList.length === 0 ? (
                <div
                  className="text-sm font-bold italic"
                  style={{ color: `${COLORS.navy}60` }}
                >
                  Belum ada data tipe aset di sistem.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  <Controller
                    name="tipeAsetID"
                    control={control}
                    render={({ field }) => (
                      <>
                        {tipeAsetList.map((aset: TipeAsetRef) => {
                          const values = field.value ?? [];
                          const isChecked = values.includes(aset.id);
                          return (
                            <label
                              key={aset.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isChecked ? "bg-white shadow-sm" : "hover:bg-black/5"}`}
                              style={{
                                borderColor: isChecked
                                  ? COLORS.navy
                                  : `${COLORS.navy}15`,
                              }}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  if (checked === true) {
                                    field.onChange([...values, aset.id]);
                                  } else {
                                    field.onChange(
                                      values.filter((val) => val !== aset.id),
                                    );
                                  }
                                }}
                                className="mt-0.5 data-[state=checked]:bg-[#0A2947] data-[state=checked]:border-[#0A2947] data-[state=checked]:text-[#FFFAF3]"
                              />
                              <div className="flex flex-col">
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: COLORS.navy }}
                                >
                                  {aset.namaTipeAset}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/outlet/reservasi/tarif")}
            className="font-bold border-gray-300 hover:bg-gray-100"
            disabled={createMutation.isPending}
            style={{ color: COLORS.navy }}
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="font-bold shadow-md hover:-translate-y-0.5 transition-transform"
            disabled={createMutation.isPending}
            style={{ background: COLORS.navy, color: COLORS.cream }}
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">Menyimpan...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" /> Simpan Tarif
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
