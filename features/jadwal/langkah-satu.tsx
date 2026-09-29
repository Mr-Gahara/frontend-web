"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PilihTanggal } from "@/components/pilih-tanggal";
import {
  CalendarRange,
  Users,
  ArrowRight,
  Info,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { keTanggalLokal } from "@/lib/waktu";
import { uraiTanggalLokal } from "./rentang";
import { skemaGenerate, type NilaiGenerate } from "./schema";
import type { KaryawanRuang } from "./tipe";
import type { PolaRosterItem } from "@/types/pola-roster";

export interface GenerateParams {
  polaId: string;
  startDate: string;
  endDate: string;
  karyawanIds: string[];
}

interface StepSatuFormProps {
  polaRosterList: PolaRosterItem[];
  karyawanList: KaryawanRuang[];
  onNext: (params: GenerateParams) => void;
  onCancel: () => void;
  initialData?: GenerateParams;
}

/**
 * Langkah 1 generate: pola roster, rentang tanggal, dan karyawan (keputusan
 * GN4a). Pesan galat sama dengan form lama; tanggal memakai PilihTanggal
 * dan karyawan dipilih lewat kotak centang berlabel (GN5).
 */
export function StepSatuForm({
  polaRosterList,
  karyawanList,
  onNext,
  onCancel,
  initialData,
}: StepSatuFormProps) {
  const [openPola, setOpenPola] = useState(false);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NilaiGenerate>({
    resolver: zodResolver(skemaGenerate),
    defaultValues: {
      polaId: initialData?.polaId ?? "",
      mulai: initialData ? uraiTanggalLokal(initialData.startDate) : undefined,
      sampai: initialData ? uraiTanggalLokal(initialData.endDate) : undefined,
      karyawanIds: initialData?.karyawanIds ?? [],
    },
  });
  const [polaId, karyawanIds] = useWatch({ control, name: ["polaId", "karyawanIds"] });
  const pesanGalat =
    errors.polaId?.message ??
    errors.mulai?.message ??
    errors.sampai?.message ??
    errors.karyawanIds?.message ??
    errors.karyawanIds?.root?.message;

  const toggleKaryawan = (id: string) =>
    setValue(
      "karyawanIds",
      karyawanIds.includes(id) ? karyawanIds.filter((k) => k !== id) : [...karyawanIds, id],
    );
  const toggleAllKaryawan = (pilih: boolean) =>
    setValue("karyawanIds", pilih ? karyawanList.map((k) => k.id) : []);

  const kirim = handleSubmit((nilai) =>
    onNext({
      polaId: nilai.polaId,
      startDate: keTanggalLokal(nilai.mulai as Date),
      endDate: keTanggalLokal(nilai.sampai as Date),
      karyawanIds: nilai.karyawanIds,
    }),
  );

  const isAllSelected =
    karyawanIds.length === karyawanList.length && karyawanList.length > 0;

  return (
    <div className="bg-[#FFFAF3] border border-[#041E3F]/10 rounded-2xl shadow-sm p-6 sm:p-8 w-full max-w-5xl mx-auto">
      <div className="mb-8 border-b border-[#041E3F]/10 pb-6">
        <h2 className="text-xl font-bold text-[#041E3F]">
          Langkah 1: Parameter Jadwal
        </h2>
        <p className="text-sm font-semibold text-[#041E3F]/60 mt-1">
          Pilih template pola kerja, rentang waktu, dan karyawan yang akan
          diterapkan.
        </p>
      </div>

      {pesanGalat && (
        <div
          role="alert"
          className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2 mb-6"
        >
          <Info className="h-4 w-4 shrink-0" />
          <p>{pesanGalat}</p>
        </div>
      )}

      <form
        onSubmit={kirim}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* KOLOM KIRI: Pengaturan Pola & Waktu */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="space-y-3 bg-[#F2EAE1] p-5 rounded-xl border border-[#041E3F]/10">
            <span
              id="label-pola-generate"
              className="flex items-center gap-2 text-sm font-bold text-[#041E3F]"
            >
              <CalendarRange className="h-5 w-5 text-[#041E3F]/70" />
              Template Pola Roster
            </span>
            <Popover open={openPola} onOpenChange={setOpenPola}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPola}
                  aria-labelledby="label-pola-generate"
                  className={cn(
                    "w-full justify-between font-bold cursor-pointer bg-[#FFFAF3] border-[#041E3F]/15 h-12 rounded-xl px-4 hover:bg-[#041E3F]/5 text-[#041E3F]",
                    !polaId && "text-[#041E3F]/50 font-medium",
                  )}
                >
                  {polaId
                    ? polaRosterList.find((p) => p.id === polaId)?.namaPola
                    : "Pilih pola yang sudah dibuat..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0 border-[#041E3F]/10 bg-[#FFFAF3] shadow-lg rounded-xl"
                align="start"
              >
                <Command className="bg-[#FFFAF3]">
                  <CommandInput
                    placeholder="Cari pola roster..."
                    className="text-[#041E3F]"
                  />
                  <CommandList>
                    <CommandEmpty className="py-4 text-center text-sm font-medium text-[#041E3F]/60">
                      Pola roster tidak ditemukan.
                    </CommandEmpty>
                    <CommandGroup>
                      {polaRosterList.map((pola) => (
                        <CommandItem
                          key={pola.id}
                          value={pola.namaPola}
                          onSelect={() => {
                            setValue("polaId", pola.id);
                            setOpenPola(false);
                          }}
                          className="cursor-pointer text-[#041E3F] hover:bg-[#041E3F]/5 font-medium"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-[#718355]",
                              polaId === pola.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="flex-1">{pola.namaPola}</span>
                          <span className="text-xs font-bold text-[#041E3F]/50">
                            ({pola.siklusHari} Hari)
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F2EAE1] p-5 rounded-xl border border-[#041E3F]/10">
            <div className="space-y-3">
              <label htmlFor="mulai-generate" className="text-sm font-bold text-[#041E3F]">
                Mulai Tanggal
              </label>
              <Controller
                control={control}
                name="mulai"
                render={({ field }) => (
                  <PilihTanggal
                    id="mulai-generate"
                    label="Mulai Tanggal"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="sampai-generate" className="text-sm font-bold text-[#041E3F]">
                Sampai Tanggal
              </label>
              <Controller
                control={control}
                name="sampai"
                render={({ field }) => (
                  <PilihTanggal
                    id="sampai-generate"
                    label="Sampai Tanggal"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 text-sky-800 p-4 rounded-xl">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold">Informasi Simulasi</h4>
              <p className="text-xs font-semibold leading-relaxed">
                Di langkah selanjutnya, Anda dapat melihat pratinjau jadwal
                sebelum disimpan. Sistem akan mendeteksi karyawan yang sedang
                Cuti/Sakit secara otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: Multi-Select Karyawan */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-100">
          <div className="flex flex-col flex-1 border border-[#041E3F]/15 bg-[#F2EAE1] rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[#041E3F]/10 bg-[#FFFAF3]">
              <span className="flex items-center gap-2 text-sm font-bold text-[#041E3F]">
                <Users className="h-5 w-5 text-[#041E3F]/70" />
                Target Karyawan
              </span>
              <span className="text-xs font-black text-[#FFFAF3] bg-[#041E3F] px-2.5 py-1 rounded-md shadow-sm">
                {karyawanIds.length} Dipilih
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3.5 border-b border-[#041E3F]/10 bg-[#041E3F]/5 transition-colors hover:bg-[#041E3F]/10">
              <Checkbox
                id="pilih-semua-karyawan"
                checked={isAllSelected}
                onCheckedChange={(c) => toggleAllKaryawan(c === true)}
                className="rounded-full border-[#041E3F]/30 data-[state=checked]:bg-[#041E3F] data-[state=checked]:border-[#041E3F] data-[state=checked]:text-[#FFFAF3]"
              />
              <label
                htmlFor="pilih-semua-karyawan"
                className="text-sm font-bold text-[#041E3F] cursor-pointer select-none"
              >
                Pilih Semua Karyawan
              </label>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar p-2 gap-1 max-h-87.5">
              {karyawanList.length === 0 && (
                <div className="p-4 text-center text-sm font-bold text-[#041E3F]/50">
                  Tidak ada karyawan tersedia.
                </div>
              )}
              {karyawanList.map((emp) => {
                const idKotak = `karyawan-generate-${emp.id}`;
                return (
                  <div
                    key={emp.id}
                    className="flex items-center space-x-3 p-3 hover:bg-[#FFFAF3] rounded-lg transition-colors border border-transparent hover:border-[#041E3F]/10"
                  >
                    <Checkbox
                      id={idKotak}
                      checked={karyawanIds.includes(emp.id)}
                      onCheckedChange={() => toggleKaryawan(emp.id)}
                      className="rounded-md border-[#041E3F]/30 data-[state=checked]:bg-[#041E3F] data-[state=checked]:border-[#041E3F] data-[state=checked]:text-[#FFFAF3]"
                    />
                    <label htmlFor={idKotak} className="flex flex-col cursor-pointer">
                      <span className="text-sm font-bold text-[#041E3F] leading-none">
                        {emp.nama}
                      </span>
                      <span className="text-xs font-semibold text-[#041E3F]/60 mt-1.5">
                        {emp.role}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="lg:col-span-12 flex items-center justify-end gap-3 mt-4 pt-6 border-t border-[#041E3F]/10">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-12 px-6 border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 font-bold rounded-xl cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="h-12 px-8 bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer group"
          >
            Lanjut Pratinjau
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </form>
    </div>
  );
}
