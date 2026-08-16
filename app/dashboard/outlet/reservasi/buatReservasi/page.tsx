"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { apiClient } from "@/lib/apiClient";
import {
  SesiBookingBatchPayload,
  SesiBookingResponse,
} from "@/types/sesiBooking";
import { Aset } from "@/types/aset";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  User,
  CalendarDays,
  Receipt,
  Plus,
  Trash2,
  Box,
  Check,
  ChevronsUpDown,
  Sparkles,
  CalendarIcon,
  Timer,
  Clock3,
  Tag,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Calendar } from "@/components/calendar";
import { format, addHours } from "date-fns";
import { id as localeID } from "date-fns/locale";

// --- ZOD SCHEMA ---
const bookingItemSchema = z
  .object({
    dataAset: z.string().min(1, "Aset wajib dipilih"),
    waktuMulai: z.string().min(1, "Waktu mulai wajib diisi"),
    waktuSelesai: z.string().min(1, "Waktu selesai wajib diisi"),
    diskonItem: z.array(z.string()).default([]), // KOREKSI: Tambahan untuk Diskon
  })
  .superRefine((data, ctx) => {
    if (data.waktuMulai && data.waktuSelesai) {
      if (new Date(data.waktuSelesai) <= new Date(data.waktuMulai)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Waktu selesai harus setelah waktu mulai",
          path: ["waktuSelesai"],
        });
      }
    }
  });

const sesiBookingSchema = z.object({
  dataPelanggan: z.string().min(1, "Pelanggan wajib dipilih"),
  items: z.array(bookingItemSchema).min(1),
});

type BookingFormInput = z.input<typeof sesiBookingSchema>;
type BookingFormOutput = z.output<typeof sesiBookingSchema>;

// --- TIPE LOKAL ---
interface WaktuState {
  tanggal: Date;
  jamStr: string;
  menitStr: string;
  durasi: number;
}

interface PelangganItem {
  id?: string;
  _id?: string;
  namaPelanggan: string;
}

// --- KONSTANTA ---
const DURASI_OPTIONS = [1, 2, 3, 4, 5, 6, 8] as const;

// --- HELPERS ---
const toSafeArray = <T,>(val: unknown): T[] =>
  Array.isArray(val) ? (val as T[]) : [];

const staticInitWaktu = (): WaktuState => ({
  tanggal: new Date("2024-01-01T00:00:00"),
  jamStr: "12",
  menitStr: "00",
  durasi: 1,
});

const dynamicInitWaktu = (): WaktuState => {
  const now = new Date();
  return {
    tanggal: now,
    jamStr: String(now.getHours()).padStart(2, "0"),
    menitStr: String(now.getMinutes()).padStart(2, "0"),
    durasi: 1,
  };
};

const parseJam = (str: string): number =>
  Math.max(0, Math.min(23, parseInt(str, 10) || 0));

const parseMenit = (str: string): number =>
  Math.max(0, Math.min(59, parseInt(str, 10) || 0));

const formatJam = (h: number, m = 0): string =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

const toDateParam = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// --- KOMPONEN UTAMA ---
export default function BuatReservasiPage() {
  useAuthGuard();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isMounted, setIsMounted] = useState(false);

  const [openPelanggan, setOpenPelanggan] = useState(false);
  const [waktuStates, setWaktuStates] = useState<WaktuState[]>([
    staticInitWaktu(),
  ]);
  const [openCal, setOpenCal] = useState<number | null>(null);

  // State untuk Diskon
  const [openDiskonItem, setOpenDiskonItem] = useState<number | null>(null);
  const [openDiskonGlobal, setOpenDiskonGlobal] = useState(false);
  const [diskonGlobalIDs, setDiskonGlobalIDs] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<BookingFormInput, any, BookingFormOutput>({
    resolver: zodResolver(sesiBookingSchema),
    defaultValues: {
      dataPelanggan: "",
      items: [
        { dataAset: "", waktuMulai: "", waktuSelesai: "", diskonItem: [] },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const watchedPelangganId = useWatch({ control, name: "dataPelanggan" });

  // --- SYNC WAKTU STATE → RHF ---
  const syncWaktu = useCallback(
    (index: number, state: WaktuState) => {
      const jam = parseJam(state.jamStr);
      const menit = parseMenit(state.menitStr);
      const mulai = new Date(state.tanggal);
      mulai.setHours(jam, menit, 0, 0);
      const selesai = addHours(mulai, state.durasi);
      setValue(`items.${index}.waktuMulai`, mulai.toISOString(), {
        shouldValidate: true,
      });
      setValue(`items.${index}.waktuSelesai`, selesai.toISOString(), {
        shouldValidate: true,
      });
    },
    [setValue],
  );

  useEffect(() => {
    setIsMounted(true);
    const initialRealTime = dynamicInitWaktu();
    setWaktuStates([initialRealTime]);
    syncWaktu(0, initialRealTime);
  }, [syncWaktu]);

  const updateWaktu = useCallback(
    (index: number, patch: Partial<WaktuState>) => {
      setWaktuStates((prev) => {
        const next = prev.map((s, i) => (i === index ? { ...s, ...patch } : s));
        syncWaktu(index, next[index]);
        return next;
      });
    },
    [syncWaktu],
  );

  const handleAppend = useCallback(() => {
    const newState = dynamicInitWaktu();
    append({ dataAset: "", waktuMulai: "", waktuSelesai: "", diskonItem: [] });
    setWaktuStates((prev) => {
      const nextIndex = prev.length;
      setTimeout(() => syncWaktu(nextIndex, newState), 0);
      return [...prev, newState];
    });
  }, [append, syncWaktu]);

  const handleRemove = useCallback(
    (index: number) => {
      remove(index);
      setWaktuStates((prev) => prev.filter((_, i) => i !== index));
    },
    [remove],
  );

  // --- QUERIES ---
  const { data: pelangganList = [], isLoading: loadPelanggan } = useQuery<
    PelangganItem[]
  >({
    queryKey: queryKeys.pelanggan,
    queryFn: async () => {
      const res = await apiClient.get<any>("/pelanggan", undefined, "pengguna");
      if (!res) return [];
      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });

  const { data: asetList = [], isLoading: loadAset } = useQuery<Aset[]>({
    queryKey: queryKeys.aset,
    queryFn: async () => {
      const res = await apiClient.get<any>("/aset", undefined, "pengguna");
      if (!res) return [];
      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? raw : [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });

  // KOREKSI: Ambil list diskon dari server untuk fitur diskon
  const { data: diskonList = [] } = useQuery({
    queryKey: ["diskon-aktif"],
    queryFn: async () => {
      const res = await apiClient.get<any>("/diskon", undefined, "pengguna");
      return (res.data?.data || res.data || []) as any[];
    },
  });

  const activeDiskonItem = useMemo(
    () =>
      diskonList.filter((d) => d.status === "Aktif" && d.cakupan === "Item"),
    [diskonList],
  );
  const activeDiskonGlobal = useMemo(
    () =>
      diskonList.filter((d) => d.status === "Aktif" && d.cakupan === "Global"),
    [diskonList],
  );

  // KOREKSI: Cek ketersediaan aset secara real-time dari riwayat Sesi Booking
  // Kita fetch data booking berdasarkan tanggal unik yang dipilih di form
  const uniqueDates = useMemo(() => {
    return Array.from(new Set(waktuStates.map((s) => toDateParam(s.tanggal))));
  }, [waktuStates]);

  const { data: bookingData = [] } = useQuery({
    queryKey: ["sesi-booking-multi", uniqueDates],
    queryFn: async () => {
      const allBookings: SesiBookingResponse[] = [];
      for (const date of uniqueDates) {
        const res = await apiClient.get<any>(
          `/sesiBooking?tanggal=${date}`,
          undefined,
          "pengguna",
        );
        const raw = res.data?.data || res.data || [];
        if (Array.isArray(raw)) allBookings.push(...raw);
      }
      return allBookings;
    },
    enabled: uniqueDates.length > 0,
    refetchInterval: 60000, // Cek tiap menit agar up-to-date
  });

  // --- LOGIKA HELPER DISKON (Anti-tabrakan Diskon) ---
  const toggleDiskonSelection = (
    currentIds: string[],
    newId: string,
    availableList: any[],
  ) => {
    const target = availableList.find((d) => (d._id || d.id) === newId);
    if (!target) return currentIds;
    if (currentIds.includes(newId))
      return currentIds.filter((id) => id !== newId);
    if (!target.bisaDigabung) return [newId];
    const currentSelected = availableList.filter((d) =>
      currentIds.includes(d._id || d.id),
    );
    if (currentSelected.some((d) => !d.bisaDigabung)) return [newId];
    return [...currentIds, newId];
  };

  const toggleItemDiskon = (index: number, diskonId: string) => {
    const currentItems = getValues("items");
    const currentDiskon = currentItems[index]?.diskonItem || [];
    const newDiskon = toggleDiskonSelection(
      currentDiskon,
      diskonId,
      activeDiskonItem,
    );
    setValue(`items.${index}.diskonItem`, newDiskon, { shouldValidate: true });
  };

  // --- LOGIKA DETEKSI OVERLAP ---
  const getOverlapBooking = (asetId: string, mulai: Date, selesai: Date) => {
    if (!asetId) return null;
    for (const b of bookingData) {
      if (b.dataAset?.id === asetId && b.status !== "Batal") {
        const bStart = new Date(b.waktuMulai);
        const bEnd = b.waktuSelesai
          ? new Date(b.waktuSelesai)
          : addHours(bStart, 1);
        // Overlap Check (StartA < EndB && EndA > StartB)
        if (mulai < bEnd && selesai > bStart) {
          return b;
        }
      }
    }
    return null;
  };

  const overlappingStatus = useMemo(() => {
    return watchedItems.map((item, index) => {
      const state = waktuStates[index];
      if (!state || !item.dataAset) return null;
      const jam = parseJam(state.jamStr);
      const menit = parseMenit(state.menitStr);
      const mulai = new Date(state.tanggal);
      mulai.setHours(jam, menit, 0, 0);
      const selesai = addHours(mulai, state.durasi);
      return getOverlapBooking(item.dataAset, mulai, selesai);
    });
  }, [watchedItems, waktuStates, bookingData]);

  const hasAnyOverlap = overlappingStatus.some((s) => s !== null);

  const safePelangganList = toSafeArray<PelangganItem>(pelangganList);

  // KOREKSI UTAMA FILTER ASET: Jangan hanya "tersedia",
  // tampilkan semua KECUALI "perbaikan".
  const safeAsetList = toSafeArray<Aset>(asetList).filter(
    (aset) => aset?.status !== "perbaikan",
  );

  const selectedPelangganName =
    safePelangganList.find(
      (p) => String(p.id ?? p._id) === String(watchedPelangganId),
    )?.namaPelanggan ?? "Belum dipilih";

  // --- MUTATION ---
  const createMutation = useMutation<any, Error, SesiBookingBatchPayload>({
    mutationFn: (payload) =>
      apiClient.post("/sesiBooking", payload, undefined, "pengguna"),
    onSuccess: (res) => {
      toast.success("Reservasi Berhasil!", {
        description: "Invoice penjualan telah terbuat secara otomatis.",
      });
      queryClient.invalidateQueries({ queryKey: ["booking"] });
      queryClient.invalidateQueries({ queryKey: ["penjualan"] });
      const idPenjualan =
        res?.data?.data?.penjualanID ?? res?.data?.penjualanID;
      router.push(
        idPenjualan
          ? `/dashboard/outlet/penjualan/${idPenjualan}`
          : "/dashboard/outlet/penjualan",
      );
    },
    onError: (err: any) => {
      const backendErrors: string[] | undefined =
        err?.response?.data?.errors ?? err?.data?.errors;
      const description = backendErrors?.length
        ? backendErrors.join(", ")
        : (err?.response?.data?.message ??
          err?.message ??
          "Terjadi kesalahan.");
      toast.error("Gagal Menyimpan", { description });
      queryClient.invalidateQueries({ queryKey: ["sesi-booking-multi"] });
    },
  });

  const onSubmit = (data: BookingFormOutput) => {
    createMutation.mutate({
      dataPelanggan: data.dataPelanggan,
      diskonGlobal: diskonGlobalIDs.length > 0 ? diskonGlobalIDs : undefined,
      items: data.items.map((item) => ({
        dataAset: item.dataAset,
        waktuMulai: new Date(item.waktuMulai).toISOString(),
        waktuSelesai: new Date(item.waktuSelesai).toISOString(),
        diskonItem: item.diskonItem.length > 0 ? item.diskonItem : undefined,
      })),
    });
  };

  if (!isMounted) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 opacity-0">
        Memuat antarmuka reservasi...
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit cursor-pointer px-0 text-[#0A2947]/60 hover:bg-transparent hover:text-[#0A2947] font-semibold"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Buat Sesi Booking (Reservasi)
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Sistem akan mencatat jadwal dan secara otomatis membuat Invoice
            tagihan untuk pelanggan.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* PANEL KIRI */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* BENTO 1: PELANGGAN */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3 mb-5">
              <User className="h-5 w-5 text-[#D4A373]" />
              <h3 className="text-base font-bold text-[#0A2947]">
                Data Pelanggan
              </h3>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Pilih Pelanggan Penyewa <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="dataPelanggan"
                control={control}
                render={({ field }) => (
                  <Popover open={openPelanggan} onOpenChange={setOpenPelanggan}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={loadPelanggan}
                        className={cn(
                          "w-full justify-between cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold h-12",
                          errors.dataPelanggan && "border-rose-500",
                        )}
                      >
                        {field.value
                          ? (safePelangganList.find(
                              (p) => String(p.id ?? p._id) === field.value,
                            )?.namaPelanggan ?? "—")
                          : loadPelanggan
                            ? "Memuat..."
                            : "Ketik untuk mencari pelanggan..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0 border-[#0A2947]/10"
                      align="start"
                    >
                      <Command className="bg-[#FFFAF3]">
                        <CommandInput
                          placeholder="Cari nama pelanggan..."
                          className="text-[#0A2947]"
                        />
                        <CommandList>
                          <CommandEmpty className="py-6 text-center text-sm text-[#0A2947]/60 font-medium">
                            Pelanggan tidak ditemukan.
                          </CommandEmpty>
                          <CommandGroup>
                            {safePelangganList.map((pel) => {
                              const pelId = String(pel.id ?? pel._id);
                              return (
                                <CommandItem
                                  key={pelId}
                                  value={pel.namaPelanggan}
                                  onSelect={() => {
                                    field.onChange(pelId);
                                    setOpenPelanggan(false);
                                  }}
                                  className="cursor-pointer text-[#0A2947] aria-selected:bg-[#0A2947]/5 font-bold"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4 text-[#718355]",
                                      field.value === pelId
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {pel.namaPelanggan}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dataPelanggan && (
                <p className="text-xs font-bold text-rose-500">
                  {errors.dataPelanggan.message}
                </p>
              )}
            </div>
          </div>

          {/* BENTO 2: DAFTAR FASILITAS */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#FFFAF3] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#0A2947]/10 bg-[#F2EAE1]">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#718355]" />
                <h3 className="text-base font-bold text-[#0A2947]">
                  Daftar Fasilitas & Jadwal Sewa
                </h3>
              </div>
              <p className="text-xs font-medium text-[#0A2947]/60 mt-1">
                Atur aset/ruangan mana saja yang akan dibooking. Anda dapat
                menyewa banyak fasilitas sekaligus.
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              {fields.map((field, index) => {
                const state = waktuStates[index];
                if (!state) return null;
                const jam = parseJam(state.jamStr);
                const menit = parseMenit(state.menitStr);
                const mulaiDate = new Date(state.tanggal);
                mulaiDate.setHours(jam, menit, 0, 0);
                const selesaiDate = addHours(mulaiDate, state.durasi);

                const overlapData = overlappingStatus[index];
                const currentItemWatcher = watchedItems[index] || {};

                return (
                  <div
                    key={field.id}
                    className="rounded-xl border border-[#0A2947]/10 p-4 sm:p-5 bg-white shadow-sm flex flex-col gap-5"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#0A2947]/5 pb-3">
                      <span className="text-xs font-bold px-2.5 py-1 bg-[#0A2947]/5 text-[#0A2947]/80 rounded-md">
                        Fasilitas #{index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemove(index)}
                          className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
                        </Button>
                      )}
                    </div>

                    {/* Pilih Aset */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#0A2947] flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-[#D4A373]" /> Pilih
                        Aset / Meja / Ruangan
                      </label>
                      <Controller
                        name={`items.${index}.dataAset`}
                        control={control}
                        render={({ field: f }) => (
                          <Select
                            onValueChange={f.onChange}
                            value={f.value || undefined}
                            disabled={loadAset}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold h-11",
                                errors.items?.[index]?.dataAset &&
                                  "border-rose-500",
                              )}
                            >
                              <SelectValue
                                placeholder={
                                  loadAset
                                    ? "Memuat aset..."
                                    : "Pilih aset yang tersedia"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                              {safeAsetList.map((aset) => (
                                <SelectItem
                                  key={aset.id}
                                  value={String(aset.id)}
                                  className="cursor-pointer font-bold hover:bg-[#0A2947]/5"
                                >
                                  {aset.namaAset}{" "}
                                  <span className="text-xs font-medium text-[#0A2947]/50 ml-1">
                                    (
                                    {aset.dataAset?.namaTipeAset ?? "Tipe Umum"}
                                    )
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.items?.[index]?.dataAset && (
                        <p className="text-[10px] font-bold text-rose-500">
                          {errors.items[index]?.dataAset?.message}
                        </p>
                      )}
                    </div>

                    {/* TANGGAL + JAM MULAI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0A2947] flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#D4A373]" />{" "}
                          Tanggal
                        </label>
                        <Popover
                          open={openCal === index}
                          onOpenChange={(o) => setOpenCal(o ? index : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full h-11 justify-start text-left font-bold cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947]"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-[#D4A373]" />
                              {format(state.tanggal, "dd MMMM yyyy", {
                                locale: localeID,
                              })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 border-[#0A2947]/10 bg-[#FFFAF3]"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={state.tanggal}
                              onSelect={(date) => {
                                if (date) {
                                  updateWaktu(index, { tanggal: date });
                                  setOpenCal(null);
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#0A2947] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#718355]" /> Jam
                          Mulai
                        </label>
                        <div className="flex h-11 w-full items-center gap-1 rounded-md border border-[#0A2947]/20 bg-[#FFFAF3] px-3 focus-within:ring-1 focus-within:ring-[#0A2947]">
                          <Clock3 className="h-4 w-4 text-[#D4A373] shrink-0" />
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="00"
                            className="w-8 bg-transparent text-center font-bold font-mono text-[#0A2947] outline-none"
                            value={state.jamStr}
                            onChange={(e) =>
                              setWaktuStates((prev) =>
                                prev.map((s, i) =>
                                  i === index
                                    ? { ...s, jamStr: e.target.value }
                                    : s,
                                ),
                              )
                            }
                            onBlur={() => {
                              const normalized = String(
                                parseJam(state.jamStr),
                              ).padStart(2, "0");
                              updateWaktu(index, { jamStr: normalized });
                            }}
                          />
                          <span className="font-bold text-[#0A2947] select-none">
                            :
                          </span>
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="00"
                            className="w-8 bg-transparent text-center font-bold font-mono text-[#0A2947] outline-none"
                            value={state.menitStr}
                            onChange={(e) =>
                              setWaktuStates((prev) =>
                                prev.map((s, i) =>
                                  i === index
                                    ? { ...s, menitStr: e.target.value }
                                    : s,
                                ),
                              )
                            }
                            onBlur={() => {
                              const normalized = String(
                                parseMenit(state.menitStr),
                              ).padStart(2, "0");
                              updateWaktu(index, { menitStr: normalized });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* PILIH DURASI */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#0A2947] flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-[#D4A373]" /> Durasi
                        Sewa
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {DURASI_OPTIONS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => updateWaktu(index, { durasi: d })}
                            className={cn(
                              "h-10 px-4 rounded-lg text-sm font-bold border transition-all cursor-pointer",
                              state.durasi === d
                                ? "bg-[#0A2947] text-[#FFFAF3] border-[#0A2947] shadow-sm"
                                : "bg-[#FFFAF3] text-[#0A2947]/70 border-[#0A2947]/20 hover:border-[#0A2947]/50 hover:text-[#0A2947]",
                            )}
                          >
                            {d} jam
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* DISKON ITEM */}
                    <div className="space-y-2 pt-2 border-t border-[#0A2947]/5 mt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold flex items-center gap-1.5 text-[#0A2947]">
                          <Tag className="h-3.5 w-3.5 text-[#D4A373]" /> Tambah
                          Diskon (Opsional)
                        </label>
                        <Popover
                          open={openDiskonItem === index}
                          onOpenChange={(o) =>
                            setOpenDiskonItem(o ? index : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs cursor-pointer font-bold border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5"
                            >
                              Pilih Diskon
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            className="w-64 p-0 border-[#0A2947]/10"
                          >
                            <Command className="bg-[#FFFAF3]">
                              <CommandInput
                                placeholder="Cari diskon fasilitas..."
                                className="text-[#0A2947]"
                              />
                              <CommandList>
                                <CommandEmpty className="py-4 text-center text-xs font-medium text-[#0A2947]/60">
                                  Belum ada diskon aktif.
                                </CommandEmpty>
                                <CommandGroup>
                                  {activeDiskonItem.map((d, idx) => {
                                    const targetId = d._id || d.id;
                                    const isSelected = (
                                      currentItemWatcher.diskonItem || []
                                    ).includes(targetId);
                                    const safeKey =
                                      targetId || `item-diskon-${idx}`;
                                    return (
                                      <CommandItem
                                        key={safeKey}
                                        onSelect={() =>
                                          toggleItemDiskon(index, targetId)
                                        }
                                        className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-medium"
                                      >
                                        <div className="flex flex-1 items-center gap-2">
                                          <div
                                            className={cn(
                                              "flex h-4 w-4 items-center justify-center rounded-sm border",
                                              isSelected
                                                ? "bg-[#0A2947] border-[#0A2947]"
                                                : "border-[#0A2947]/30",
                                            )}
                                          >
                                            {isSelected && (
                                              <Check className="h-3 w-3 text-[#FFFAF3]" />
                                            )}
                                          </div>
                                          <span>{d.namaDiskon}</span>
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {(currentItemWatcher.diskonItem || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(currentItemWatcher.diskonItem || []).map(
                            (id: string, idx: number) => {
                              const d = activeDiskonItem.find(
                                (x) => (x._id || x.id) === id,
                              );
                              if (!d) return null;
                              return (
                                <div
                                  key={d._id || d.id || `badge-item-${idx}`}
                                  className="px-2 py-1 rounded-md bg-[#D4A373] text-[#0A2947] text-[10px] font-bold shadow-sm"
                                >
                                  {d.namaDiskon} (
                                  {d.tipe === "persen"
                                    ? `${d.nilai}%`
                                    : `Rp ${d.nilai.toLocaleString("id-ID")}`}
                                  )
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                    </div>

                    {/* ALARM BENTROK BOOKING */}
                    {overlapData && (
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex gap-2.5 items-start mt-2 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-rose-700 font-medium leading-relaxed">
                          Aset ini sedang dipesan dari{" "}
                          <span className="font-bold underline decoration-rose-300 underline-offset-2">
                            {format(new Date(overlapData.waktuMulai), "HH:mm", {
                              locale: localeID,
                            })}
                          </span>{" "}
                          sampai{" "}
                          <span className="font-bold underline decoration-rose-300 underline-offset-2">
                            {overlapData.waktuSelesai
                              ? format(
                                  new Date(overlapData.waktuSelesai),
                                  "HH:mm",
                                  { locale: localeID },
                                )
                              : "Selesai"}
                          </span>
                          . Silakan atur ulang waktu atau pilih aset lain.
                        </div>
                      </div>
                    )}

                    {/* RINGKASAN WAKTU */}
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                        overlapData
                          ? "bg-rose-50/50 border-rose-200/50 opacity-80"
                          : "bg-[#0A2947]/5 border-[#0A2947]/10",
                      )}
                    >
                      <Clock
                        className={cn(
                          "w-4 h-4 shrink-0",
                          overlapData ? "text-rose-400" : "text-[#D4A373]",
                        )}
                      />
                      <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#0A2947]">
                        <span className="font-mono">
                          {format(mulaiDate, "dd MMM yyyy", {
                            locale: localeID,
                          })}
                          , {formatJam(jam, menit)}
                        </span>
                        <span className="text-[#0A2947]/40 font-normal">→</span>
                        <span className="font-mono">
                          {format(selesaiDate, "dd MMM yyyy", {
                            locale: localeID,
                          })}
                          ,{" "}
                          {formatJam(
                            selesaiDate.getHours(),
                            selesaiDate.getMinutes(),
                          )}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#718355]/15 text-[#718355] text-xs">
                          {state.durasi} jam
                        </span>
                      </div>
                    </div>

                    {(errors.items?.[index]?.waktuMulai ||
                      errors.items?.[index]?.waktuSelesai) && (
                      <p className="text-[10px] font-bold text-rose-500">
                        {errors.items[index]?.waktuSelesai?.message ??
                          errors.items[index]?.waktuMulai?.message}
                      </p>
                    )}
                  </div>
                );
              })}

              <Button
                type="button"
                onClick={handleAppend}
                variant="outline"
                className="w-full border-dashed border-2 border-[#0A2947]/20 text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5 hover:border-[#0A2947]/40 h-12 font-bold cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah Fasilitas Lain
              </Button>
            </div>
          </div>
        </div>

        {/* PANEL KANAN */}
        <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#0A2947] text-[#FFFAF3] p-6 sm:p-8 shadow-md flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-[#FFFAF3]/20 pb-4">
              <Receipt className="h-5 w-5 text-[#D4A373]" />
              <h2 className="font-bold text-lg tracking-wide uppercase">
                Ringkasan Reservasi
              </h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5 bg-[#FFFAF3]/5 p-3 rounded-xl border border-[#FFFAF3]/10">
                <p className="text-xs font-bold text-[#FFFAF3]/60 uppercase tracking-wider">
                  Penyewa
                </p>
                <p className="font-bold text-[#D4A373] text-base truncate">
                  {selectedPelangganName}
                </p>
              </div>
              <div className="space-y-1.5 bg-[#FFFAF3]/5 p-3 rounded-xl border border-[#FFFAF3]/10">
                <p className="text-xs font-bold text-[#FFFAF3]/60 uppercase tracking-wider">
                  Total Fasilitas
                </p>
                <p className="font-bold text-[#FFFAF3] text-base">
                  {watchedItems.length} Aset
                </p>
              </div>

              {/* DISKON GLOBAL PANEL KANAN */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#FFFAF3]/60 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#D4A373]" /> Diskon Global
                    Transaksi
                  </p>
                  <Popover
                    open={openDiskonGlobal}
                    onOpenChange={setOpenDiskonGlobal}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] cursor-pointer font-bold bg-[#FFFAF3]/10 text-[#FFFAF3] hover:bg-[#FFFAF3]/20 hover:text-[#FFFAF3]"
                      >
                        Pilih Diskon
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      className="w-64 p-0 border-[#0A2947]/10"
                    >
                      <Command className="bg-[#FFFAF3]">
                        <CommandInput
                          placeholder="Cari diskon transaksi..."
                          className="text-[#0A2947]"
                        />
                        <CommandList>
                          <CommandEmpty className="py-4 text-center text-xs font-medium text-[#0A2947]/60">
                            Belum ada diskon aktif.
                          </CommandEmpty>
                          <CommandGroup>
                            {activeDiskonGlobal.map((d, index) => {
                              const targetId = d._id || d.id;
                              const isSelected =
                                diskonGlobalIDs.includes(targetId);
                              const safeKey =
                                targetId || `global-diskon-${index}`;
                              return (
                                <CommandItem
                                  key={safeKey}
                                  onSelect={() =>
                                    setDiskonGlobalIDs((prev) =>
                                      toggleDiskonSelection(
                                        prev,
                                        targetId,
                                        activeDiskonGlobal,
                                      ),
                                    )
                                  }
                                  className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-medium"
                                >
                                  <div className="flex flex-1 items-center gap-2">
                                    <div
                                      className={cn(
                                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                                        isSelected
                                          ? "bg-[#0A2947] border-[#0A2947]"
                                          : "border-[#0A2947]/30",
                                      )}
                                    >
                                      {isSelected && (
                                        <Check className="h-3 w-3 text-[#FFFAF3]" />
                                      )}
                                    </div>
                                    <span>{d.namaDiskon}</span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {diskonGlobalIDs.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1.5">
                    {diskonGlobalIDs.map((id, idx) => {
                      const d = activeDiskonGlobal.find(
                        (x) => (x._id || x.id) === id,
                      );
                      if (!d) return null;
                      return (
                        <div
                          key={d._id || d.id || `badge-global-${idx}`}
                          className="px-2 py-1 rounded-md bg-[#D4A373] text-[#0A2947] text-[10px] font-bold shadow-sm"
                        >
                          {d.namaDiskon} (
                          {d.tipe === "persen"
                            ? `${d.nilai}%`
                            : `Rp ${d.nilai.toLocaleString("id-ID")}`}
                          )
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {waktuStates.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#FFFAF3]/10">
                  {waktuStates.map((s, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs text-[#FFFAF3]/70 font-medium px-1"
                    >
                      <span>Fasilitas #{i + 1}</span>
                      <span className="font-mono font-bold text-[#FFFAF3]/90">
                        {formatJam(parseJam(s.jamStr), parseMenit(s.menitStr))}{" "}
                        · {s.durasi} jam
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-[#718355]/20 border border-[#718355]/30 p-4 rounded-xl flex gap-3 items-start">
              <Sparkles className="w-5 h-5 text-[#718355] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-[#FFFAF3]">
                  Sistem Otomatis (Smart Calc)
                </p>
                <p className="text-[11px] font-medium text-[#FFFAF3]/70 leading-relaxed">
                  Total tagihan (setelah diskon), tarif terbaik, dan pajak akan
                  di-generate otomatis oleh server setelah data disimpan.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-[#FFFAF3]/20 flex flex-col gap-3">
              <Button
                type="submit"
                // KOREKSI: Disable tombol jika ada overlapping
                disabled={createMutation.isPending || hasAnyOverlap}
                className={cn(
                  "w-full text-[#FFFAF3] shadow-lg font-bold h-14 text-base transition-colors",
                  hasAnyOverlap
                    ? "bg-rose-500/50 cursor-not-allowed opacity-80"
                    : "bg-[#718355] hover:bg-[#718355]/90 cursor-pointer",
                )}
              >
                {createMutation.isPending
                  ? "Memproses Data..."
                  : hasAnyOverlap
                    ? "Waktu Terpakai"
                    : "Proses & Buat Tagihan"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="w-full text-[#FFFAF3]/60 hover:text-[#FFFAF3] hover:bg-[#FFFAF3]/10 font-bold h-12 cursor-pointer"
              >
                Batalkan
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
