"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Check, ChevronsUpDown, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDaftarAset } from "@/features/aset/hooks";
import { diskonAktif, pilihDiskon } from "@/features/diskon/filter";
import { useDaftarDiskon } from "@/features/diskon/hooks";
import { useDaftarPelanggan } from "@/features/pelanggan/hooks";
import { isApiError, pesanError } from "@/lib/api/error";
import { cn } from "@/lib/utils";
import { keTanggalLokal } from "@/lib/waktu";
import { useBookingBanyakTanggal, useBuatBooking } from "./hooks";
import { KartuFasilitas } from "./kartu-fasilitas";
import { PanelRingkasan } from "./panel-ringkasan";
import { susunPayloadBooking } from "./payload";
import { skemaBooking, type NilaiFormBooking } from "./schema";
import { bookingBentrok } from "./tampilan";
import { isianWaktuItem, rentangWaktuItem, waktuItemDari, type WaktuItem } from "./waktu-booking";

/** Pesan gagal simpan: isi errors dari galat validasi digabung bila ada, sama dengan halaman lama. */
function pesanGagalSimpan(galat: unknown): string {
  if (isApiError(galat) && galat.errors?.length) return galat.errors.join(", ");
  return pesanError(galat, "Terjadi kesalahan.");
}

/**
 * Buat reservasi (sesi booking jalur batch). Dipindah dari halaman lama dan
 * dipecah menjadi KartuFasilitas dan PanelRingkasan (keputusan R9b).
 * Waktu per fasilitas disimpan di luar form sebagai WaktuItem, lalu
 * waktuMulai dan waktuSelesai form diisi dari sana. Bentrok hanya menghitung
 * booking Aktif (R6a), dan pilihan diskon mengikuti pilihDiskon (R7b).
 */
export default function HalamanBuatReservasi() {
  const router = useRouter();
  // Form baru dirender setelah hidrasi, karena waktu awalnya diambil dari
  // jam browser; snapshot server false menggantikan setIsMounted di effect.
  const sudahTerpasang = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [waktuItems, setWaktuItems] = useState<WaktuItem[]>(() => [waktuItemDari(new Date())]);
  const [bukaPelanggan, setBukaPelanggan] = useState(false);
  const [diskonGlobalIDs, setDiskonGlobalIDs] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitted },
  } = useForm<NilaiFormBooking>({
    resolver: zodResolver(skemaBooking),
    defaultValues: {
      dataPelanggan: "",
      items: [{ dataAset: "", ...isianWaktuItem(waktuItems[0]), diskonItem: [] }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const watchedPelangganId = useWatch({ control, name: "dataPelanggan" });

  const { data: pelangganList = [], isLoading: memuatPelanggan } = useDaftarPelanggan();
  const { data: asetList = [], isLoading: memuatAset } = useDaftarAset();
  const { data: diskonList = [] } = useDaftarDiskon();
  const asetTersedia = useMemo(() => asetList.filter((aset) => aset.status !== "perbaikan"), [asetList]);
  const diskonItemAktif = useMemo(() => diskonAktif(diskonList, "Item"), [diskonList]);
  const diskonGlobalAktif = useMemo(() => diskonAktif(diskonList, "Global"), [diskonList]);

  const tanggalUnik = useMemo(
    () => Array.from(new Set(waktuItems.map((w) => keTanggalLokal(w.tanggal)))),
    [waktuItems],
  );
  const { data: bookingData = [] } = useBookingBanyakTanggal(tanggalUnik);

  const bentrokPerItem = watchedItems.map((item, index) => {
    const waktu = waktuItems[index];
    const rentang = waktu ? rentangWaktuItem(waktu) : null;
    return rentang && item?.dataAset ? bookingBentrok(bookingData, item.dataAset, rentang.mulai, rentang.selesai) : null;
  });
  const adaBentrok = bentrokPerItem.some((b) => b !== null);

  const namaPelanggan = pelangganList.find((p) => p.id === watchedPelangganId)?.namaPelanggan ?? "Belum dipilih";

  const ubahWaktu = (index: number, perubahan: Partial<WaktuItem>) => {
    const berikutnya = { ...waktuItems[index], ...perubahan };
    setWaktuItems((sebelum) => sebelum.map((w, i) => (i === index ? berikutnya : w)));
    const isian = isianWaktuItem(berikutnya);
    setValue(`items.${index}.waktuMulai`, isian.waktuMulai, { shouldValidate: isSubmitted });
    setValue(`items.${index}.waktuSelesai`, isian.waktuSelesai, { shouldValidate: isSubmitted });
  };

  const tambahFasilitas = () => {
    const baru = waktuItemDari(new Date());
    append({ dataAset: "", ...isianWaktuItem(baru), diskonItem: [] });
    setWaktuItems((sebelum) => [...sebelum, baru]);
  };

  const hapusFasilitas = (index: number) => {
    remove(index);
    setWaktuItems((sebelum) => sebelum.filter((_, i) => i !== index));
  };

  const pilihDiskonItem = (index: number, id: string) => {
    const terpilih = getValues(`items.${index}.diskonItem`) ?? [];
    setValue(`items.${index}.diskonItem`, pilihDiskon(terpilih, id, diskonItemAktif), { shouldValidate: true });
  };

  const buatBooking = useBuatBooking();

  const onSubmit = (nilai: NilaiFormBooking) => {
    buatBooking.mutate(susunPayloadBooking(nilai, diskonGlobalIDs), {
      onSuccess: (hasil) => {
        toast.success("Reservasi Berhasil!", {
          description: "Invoice penjualan telah terbuat secara otomatis.",
        });
        router.push(
          hasil?.penjualanID ? `/dashboard/outlet/penjualan/${hasil.penjualanID}` : "/dashboard/outlet/penjualan",
        );
      },
      onError: (galat) => {
        toast.error("Gagal Menyimpan", { description: pesanGagalSimpan(galat) });
      },
    });
  };

  if (!sudahTerpasang) {
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
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">Buat Sesi Booking (Reservasi)</h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Sistem akan mencatat jadwal dan secara otomatis membuat Invoice tagihan untuk pelanggan.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL KIRI */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* BENTO 1: PELANGGAN */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#F2EAE1] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#0A2947]/10 pb-3 mb-5">
              <User className="h-5 w-5 text-[#D4A373]" />
              <h3 className="text-base font-bold text-[#0A2947]">Data Pelanggan</h3>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#0A2947]">
                Pilih Pelanggan Penyewa <span className="text-rose-500">*</span>
              </label>
              <Controller
                name="dataPelanggan"
                control={control}
                render={({ field }) => (
                  <Popover open={bukaPelanggan} onOpenChange={setBukaPelanggan}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={memuatPelanggan}
                        className={cn(
                          "w-full justify-between cursor-pointer bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold h-12",
                          errors.dataPelanggan && "border-rose-500",
                        )}
                      >
                        {field.value
                          ? (pelangganList.find((p) => p.id === field.value)?.namaPelanggan ?? "—")
                          : memuatPelanggan
                            ? "Memuat..."
                            : "Ketik untuk mencari pelanggan..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 border-[#0A2947]/10" align="start">
                      <Command className="bg-[#FFFAF3]">
                        <CommandInput placeholder="Cari nama pelanggan..." className="text-[#0A2947]" />
                        <CommandList>
                          <CommandEmpty className="py-6 text-center text-sm text-[#0A2947]/60 font-medium">
                            Pelanggan tidak ditemukan.
                          </CommandEmpty>
                          <CommandGroup>
                            {pelangganList.map((pel) => (
                              <CommandItem
                                key={pel.id}
                                value={pel.namaPelanggan}
                                onSelect={() => {
                                  field.onChange(pel.id);
                                  setBukaPelanggan(false);
                                }}
                                className="cursor-pointer text-[#0A2947] aria-selected:bg-[#0A2947]/5 font-bold"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-[#718355]",
                                    field.value === pel.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                {pel.namaPelanggan}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dataPelanggan && (
                <p className="text-xs font-bold text-rose-500">{errors.dataPelanggan.message}</p>
              )}
            </div>
          </div>

          {/* BENTO 2: DAFTAR FASILITAS */}
          <div className="rounded-2xl border border-[#0A2947]/10 bg-[#FFFAF3] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#0A2947]/10 bg-[#F2EAE1]">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#718355]" />
                <h3 className="text-base font-bold text-[#0A2947]">Daftar Fasilitas & Jadwal Sewa</h3>
              </div>
              <p className="text-xs font-medium text-[#0A2947]/60 mt-1">
                Atur aset/ruangan mana saja yang akan dibooking. Anda dapat menyewa banyak fasilitas sekaligus.
              </p>
            </div>
            <div className="p-4 sm:p-6 space-y-6">
              {fields.map((field, index) => {
                const waktu = waktuItems[index];
                if (!waktu) return null;
                return (
                  <KartuFasilitas
                    key={field.id}
                    index={index}
                    bisaDihapus={fields.length > 1}
                    control={control}
                    errors={errors}
                    waktu={waktu}
                    onUbahWaktu={(perubahan) => ubahWaktu(index, perubahan)}
                    onHapus={() => hapusFasilitas(index)}
                    asetList={asetTersedia}
                    memuatAset={memuatAset}
                    diskonAktif={diskonItemAktif}
                    diskonTerpilih={watchedItems[index]?.diskonItem ?? []}
                    onPilihDiskon={(id) => pilihDiskonItem(index, id)}
                    bentrok={bentrokPerItem[index] ?? null}
                  />
                );
              })}

              <Button
                type="button"
                onClick={tambahFasilitas}
                variant="outline"
                className="w-full border-dashed border-2 border-[#0A2947]/20 text-[#0A2947]/70 hover:text-[#0A2947] hover:bg-[#0A2947]/5 hover:border-[#0A2947]/40 h-12 font-bold cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah Fasilitas Lain
              </Button>
            </div>
          </div>
        </div>

        {/* PANEL KANAN */}
        <PanelRingkasan
          namaPelanggan={namaPelanggan}
          jumlahFasilitas={watchedItems.length}
          diskonGlobalAktif={diskonGlobalAktif}
          diskonGlobalTerpilih={diskonGlobalIDs}
          onPilihDiskonGlobal={(id) => setDiskonGlobalIDs((sebelum) => pilihDiskon(sebelum, id, diskonGlobalAktif))}
          waktuItems={waktuItems}
          menyimpan={buatBooking.isPending}
          adaBentrok={adaBentrok}
          onBatal={() => router.back()}
        />
      </form>
    </div>
  );
}