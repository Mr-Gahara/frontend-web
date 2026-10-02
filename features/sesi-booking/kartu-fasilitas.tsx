"use client";

import { SyaratDiskon } from "@/features/diskon/syarat-diskon";
import { useState } from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { AlertCircle, Box, CalendarIcon, Check, Clock, Tag, Timer, Trash2 } from "lucide-react";
import { InputWaktu } from "@/components/input-waktu";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Aset } from "@/types/aset";
import type { Diskon } from "@/types/diskon";
import type { SesiBookingResponse } from "@/types/sesiBooking";
import type { NilaiFormBooking } from "./schema";
import { DURASI_PILIHAN, rentangWaktuItem, type WaktuItem } from "./waktu-booking";

interface PropsKartuFasilitas {
  index: number;
  bisaDihapus: boolean;
  control: Control<NilaiFormBooking>;
  errors: FieldErrors<NilaiFormBooking>;
  waktu: WaktuItem;
  onUbahWaktu: (perubahan: Partial<WaktuItem>) => void;
  onHapus: () => void;
  asetList: Aset[];
  memuatAset: boolean;
  diskonAktif: Diskon[];
  diskonTerpilih: string[];
  onPilihDiskon: (id: string) => void;
  bentrok: SesiBookingResponse | null;
  /** Booking belum dibayar yang bertumpuk: hanya peringatan (backend 465b438). */
  belumDibayar: SesiBookingResponse | null;
}

const teksRentang = (tanggal: Date, jam: Date | null) =>
  `${format(tanggal, "dd MMM yyyy", { locale: localeID })}, ${jam ? format(jam, "HH:mm") : "--:--"}`;

/** Satu kartu fasilitas di form buat reservasi (keputusan R9b). */
export function KartuFasilitas({
  index,
  bisaDihapus,
  control,
  errors,
  waktu,
  onUbahWaktu,
  onHapus,
  asetList,
  memuatAset,
  diskonAktif,
  diskonTerpilih,
  onPilihDiskon,
  bentrok,
  belumDibayar,
}: PropsKartuFasilitas) {
  const [bukaDiskon, setBukaDiskon] = useState(false);
  const nomor = index + 1;
  const rentang = rentangWaktuItem(waktu);
  const galatItem = errors.items?.[index];

  return (
    <div className="rounded-xl border border-[#0A2947]/10 p-4 sm:p-5 bg-white shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#0A2947]/5 pb-3">
        <span className="text-xs font-bold px-2.5 py-1 bg-[#0A2947]/5 text-[#0A2947]/80 rounded-md">
          Fasilitas #{nomor}
        </span>
        {bisaDihapus && (
          <Button
            type="button"
            variant="ghost"
            onClick={onHapus}
            className="h-7 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Hapus
          </Button>
        )}
      </div>

      {/* Pilih Aset */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0A2947] flex items-center gap-1.5">
          <Box className="w-3.5 h-3.5 text-[#D4A373]" /> Pilih Aset / Meja / Ruangan
        </label>
        <Controller
          name={`items.${index}.dataAset`}
          control={control}
          render={({ field: f }) => (
            <Select onValueChange={f.onChange} value={f.value || undefined} disabled={memuatAset}>
              <SelectTrigger
                className={cn(
                  "w-full bg-[#FFFAF3] border-[#0A2947]/20 text-[#0A2947] font-bold h-11",
                  galatItem?.dataAset && "border-rose-500",
                )}
              >
                <SelectValue placeholder={memuatAset ? "Memuat aset..." : "Pilih aset yang tersedia"} />
              </SelectTrigger>
              <SelectContent className="bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]">
                {asetList.map((aset) => (
                  <SelectItem key={aset.id} value={aset.id} className="cursor-pointer font-bold hover:bg-[#0A2947]/5">
                    {aset.namaAset}{" "}
                    <span className="text-xs font-medium text-[#0A2947]/50 ml-1">
                      ({aset.dataAset?.namaTipeAset ?? "Tipe Umum"})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {galatItem?.dataAset && (
          <p className="text-[10px] font-bold text-rose-500">{galatItem.dataAset.message}</p>
        )}
      </div>

      {/* TANGGAL + JAM MULAI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor={`tanggal-fasilitas-${nomor}`}
            className="text-xs font-bold text-[#0A2947] flex items-center gap-1.5"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#D4A373]" /> Tanggal
          </label>
          <PilihTanggal
            id={`tanggal-fasilitas-${nomor}`}
            label={`Tanggal Fasilitas #${nomor}`}
            value={waktu.tanggal}
            onChange={(tanggal) => onUbahWaktu({ tanggal })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor={`jam-fasilitas-${nomor}`}
            className="text-xs font-bold text-[#0A2947] flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-[#718355]" /> Jam Mulai
          </label>
          <InputWaktu
            id={`jam-fasilitas-${nomor}`}
            label={`Jam Mulai Fasilitas #${nomor}`}
            value={waktu.waktu}
            onChange={(nilai) => onUbahWaktu({ waktu: nilai })}
            invalid={!!galatItem?.waktuMulai}
            className="h-11"
          />
        </div>
      </div>

      {/* PILIH DURASI */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[#0A2947] flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-[#D4A373]" /> Durasi Sewa
        </label>
        <div className="flex flex-wrap gap-2">
          {DURASI_PILIHAN.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onUbahWaktu({ durasi: d })}
              className={cn(
                "h-10 px-4 rounded-lg text-sm font-bold border transition-all cursor-pointer",
                waktu.durasi === d
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
            <Tag className="h-3.5 w-3.5 text-[#D4A373]" /> Tambah Diskon (Opsional)
          </label>
          <Popover open={bukaDiskon} onOpenChange={setBukaDiskon}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs cursor-pointer font-bold border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5"
              >
                Pilih Diskon
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-0 border-[#0A2947]/10">
              <Command className="bg-[#FFFAF3]">
                <CommandInput placeholder="Cari diskon fasilitas..." className="text-[#0A2947]" />
                <CommandList>
                  <CommandEmpty className="py-4 text-center text-xs font-medium text-[#0A2947]/60">
                    Belum ada diskon aktif.
                  </CommandEmpty>
                  <CommandGroup>
                    {diskonAktif.map((d) => {
                      const terpilih = diskonTerpilih.includes(d.id);
                      return (
                        <CommandItem
                          key={d.id}
                          onSelect={() => onPilihDiskon(d.id)}
                          className="cursor-pointer text-[#0A2947] hover:bg-[#0A2947]/5 font-medium"
                        >
                          <div className="flex flex-1 items-center gap-2">
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border",
                                terpilih ? "bg-[#0A2947] border-[#0A2947]" : "border-[#0A2947]/30",
                              )}
                            >
                              {terpilih && <Check className="h-3 w-3 text-[#FFFAF3]" />}
                            </div>
                            <span className="flex flex-col"><span>{d.namaDiskon}</span><SyaratDiskon diskon={d} /></span>
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

        {diskonTerpilih.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {diskonTerpilih.map((id) => {
              const d = diskonAktif.find((x) => x.id === id);
              if (!d) return null;
              return (
                <div
                  key={d.id}
                  className="px-2 py-1 rounded-md bg-[#D4A373] text-[#0A2947] text-[10px] font-bold shadow-sm"
                >
                  {d.namaDiskon} ({d.tipe === "persen" ? `${d.nilai}%` : `Rp ${d.nilai.toLocaleString("id-ID")}`})
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ALARM BENTROK BOOKING */}
      {bentrok && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex gap-2.5 items-start mt-2 shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-700 font-medium leading-relaxed">
            Aset ini sedang dipesan dari{" "}
            <span className="font-bold underline decoration-rose-300 underline-offset-2">
              {format(new Date(bentrok.waktuMulai), "HH:mm", { locale: localeID })}
            </span>{" "}
            sampai{" "}
            <span className="font-bold underline decoration-rose-300 underline-offset-2">
              {bentrok.waktuSelesai
                ? format(new Date(bentrok.waktuSelesai), "HH:mm", { locale: localeID })
                : "Selesai"}
            </span>
            . Silakan atur ulang waktu atau pilih aset lain.
          </div>
        </div>
      )}

      {/* PERINGATAN BOOKING BELUM DIBAYAR (backend 465b438) */}
      {!bentrok && belumDibayar && (
        <div
          role="status"
          className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-2.5 items-start mt-2 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 font-medium leading-relaxed">
            Ada booking belum dibayar di aset ini dari{" "}
            <span className="font-bold">
              {format(new Date(belumDibayar.waktuMulai), "HH:mm", { locale: localeID })}
            </span>{" "}
            sampai{" "}
            <span className="font-bold">
              {belumDibayar.waktuSelesai
                ? format(new Date(belumDibayar.waktuSelesai), "HH:mm", { locale: localeID })
                : "Selesai"}
            </span>
            . Booking belum dibayar tidak mengunci jadwal; booking yang lebih dulu dibayar yang mendapat jadwal.
          </div>
        </div>
      )}

      {/* RINGKASAN WAKTU */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
          bentrok ? "bg-rose-50/50 border-rose-200/50 opacity-80" : "bg-[#0A2947]/5 border-[#0A2947]/10",
        )}
      >
        <Clock className={cn("w-4 h-4 shrink-0", bentrok ? "text-rose-400" : "text-[#D4A373]")} />
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-[#0A2947]">
          <span className="font-mono">{teksRentang(rentang?.mulai ?? waktu.tanggal, rentang?.mulai ?? null)}</span>
          <span className="text-[#0A2947]/40 font-normal">→</span>
          <span className="font-mono">
            {teksRentang(rentang?.selesai ?? waktu.tanggal, rentang?.selesai ?? null)}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#718355]/15 text-[#718355] text-xs">{waktu.durasi} jam</span>
        </div>
      </div>

      {(galatItem?.waktuMulai || galatItem?.waktuSelesai) && (
        <p className="text-[10px] font-bold text-rose-500">
          {galatItem?.waktuMulai?.message ?? galatItem?.waktuSelesai?.message}
        </p>
      )}
    </div>
  );
}