"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/calendar";
import {
  CalendarRange,
  Users,
  ArrowRight,
  Info,
  CalendarIcon,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { cn } from "@/lib/utils";

import { KaryawanJadwal } from "@/types/jadwal";
import { PolaRosterItem } from "@/types/pola-roster";

export interface GenerateParams {
  polaId: string;
  startDate: string;
  endDate: string;
  karyawanIds: string[];
}

interface StepSatuFormProps {
  polaRosterList: PolaRosterItem[];
  karyawanList: KaryawanJadwal[];
  onNext: (params: GenerateParams) => void;
  onCancel: () => void;
  initialData?: Partial<GenerateParams>;
}

export function StepSatuForm({
  polaRosterList,
  karyawanList,
  onNext,
  onCancel,
  initialData,
}: StepSatuFormProps) {
  // --- STATE ---
  const [selectedPola, setSelectedPola] = useState<string | undefined>(
    initialData?.polaId,
  );
  const [openPola, setOpenPola] = useState(false); // State untuk Popover Pola Roster

  const [startDate, setStartDate] = useState<string>(
    initialData?.startDate || "",
  );
  const [endDate, setEndDate] = useState<string>(initialData?.endDate || "");

  const [selectedKaryawan, setSelectedKaryawan] = useState<string[]>(
    initialData?.karyawanIds || [],
  );
  const [errorMsg, setErrorMsg] = useState("");

  // --- HANDLERS ---
  const toggleKaryawan = (id: string) => {
    setSelectedKaryawan((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    );
  };

  const toggleAllKaryawan = (checked: boolean) => {
    if (checked) {
      setSelectedKaryawan(karyawanList.map((k) => k.id));
    } else {
      setSelectedKaryawan([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedPola)
      return setErrorMsg("Silakan pilih Pola Roster terlebih dahulu.");
    if (!startDate || !endDate)
      return setErrorMsg("Rentang tanggal mulai dan selesai wajib diisi.");
    if (new Date(startDate) > new Date(endDate))
      return setErrorMsg(
        "Tanggal mulai tidak boleh lebih besar dari tanggal selesai.",
      );
    if (selectedKaryawan.length === 0)
      return setErrorMsg(
        "Minimal pilih 1 karyawan untuk digenerate jadwalnya.",
      );

    onNext({
      polaId: selectedPola,
      startDate,
      endDate,
      karyawanIds: selectedKaryawan,
    });
  };

  const isAllSelected =
    selectedKaryawan.length === karyawanList.length && karyawanList.length > 0;

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

      {errorMsg && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2 mb-6">
          <Info className="h-4 w-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
      >
        {/* KOLOM KIRI: Pengaturan Pola & Waktu */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* ✅ REVOLUSI: Menggunakan COMBOBOX (Popover + Command) Murni, Bebas Error Select! */}
          <div className="space-y-3 bg-[#F2EAE1] p-5 rounded-xl border border-[#041E3F]/10">
            <label className="flex items-center gap-2 text-sm font-bold text-[#041E3F]">
              <CalendarRange className="h-5 w-5 text-[#041E3F]/70" />
              Template Pola Roster
            </label>
            <Popover open={openPola} onOpenChange={setOpenPola}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPola}
                  className={cn(
                    "w-full justify-between font-bold cursor-pointer bg-[#FFFAF3] border-[#041E3F]/15 h-12 rounded-xl px-4 hover:bg-[#041E3F]/5 text-[#041E3F]",
                    !selectedPola && "text-[#041E3F]/50 font-medium",
                  )}
                >
                  {selectedPola
                    ? polaRosterList.find((p) => p.id === selectedPola)
                        ?.namaPola
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
                            setSelectedPola(pola.id);
                            setOpenPola(false);
                          }}
                          className="cursor-pointer text-[#041E3F] hover:bg-[#041E3F]/5 font-medium"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 text-[#718355]",
                              selectedPola === pola.id
                                ? "opacity-100"
                                : "opacity-0",
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
            {/* INPUT TANGGAL MULAI CUSTOM */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#041E3F]">
                Mulai Tanggal
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-bold cursor-pointer bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] hover:bg-[#041E3F]/5 hover:text-[#041E3F] rounded-xl px-4",
                      !startDate && "text-[#041E3F]/50",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {startDate ? (
                      format(parseISO(startDate), "dd MMMM yyyy", {
                        locale: localeID,
                      })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-[#041E3F]/10 bg-[#FFFAF3] shadow-lg rounded-[1.5rem]"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={startDate ? parseISO(startDate) : undefined}
                    onSelect={(date) => {
                      if (date) setStartDate(format(date, "yyyy-MM-dd"));
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* INPUT TANGGAL SELESAI CUSTOM */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-[#041E3F]">
                Sampai Tanggal
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-bold cursor-pointer bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] hover:bg-[#041E3F]/5 hover:text-[#041E3F] rounded-xl px-4",
                      !endDate && "text-[#041E3F]/50",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                    {endDate ? (
                      format(parseISO(endDate), "dd MMMM yyyy", {
                        locale: localeID,
                      })
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-[#041E3F]/10 bg-[#FFFAF3] shadow-lg rounded-[1.5rem]"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={endDate ? parseISO(endDate) : undefined}
                    onSelect={(date) => {
                      if (date) setEndDate(format(date, "yyyy-MM-dd"));
                    }}
                  />
                </PopoverContent>
              </Popover>
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
              <label className="flex items-center gap-2 text-sm font-bold text-[#041E3F]">
                <Users className="h-5 w-5 text-[#041E3F]/70" />
                Target Karyawan
              </label>
              <span className="text-xs font-black text-[#FFFAF3] bg-[#041E3F] px-2.5 py-1 rounded-md shadow-sm">
                {selectedKaryawan.length} Dipilih
              </span>
            </div>

            <div
              className="flex items-center space-x-3 p-3.5 border-b border-[#041E3F]/10 bg-[#041E3F]/5 transition-colors hover:bg-[#041E3F]/10 cursor-pointer"
              onClick={() => toggleAllKaryawan(!isAllSelected)}
            >
              {/* Custom Checkbox Bulat */}
              <div
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#041E3F]/30 transition-colors",
                  isAllSelected &&
                    "bg-[#041E3F] border-[#041E3F] text-[#FFFAF3]",
                )}
              >
                {isAllSelected && <Check className="h-3.5 w-3.5" />}
              </div>

              <label className="text-sm font-bold text-[#041E3F] cursor-pointer select-none">
                Pilih Semua Karyawan
              </label>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar p-2 gap-1 max-h-87.5">
              {karyawanList.length === 0 && (
                <div className="p-4 text-center text-sm font-bold text-[#041E3F]/50">
                  Tidak ada karyawan tersedia.
                </div>
              )}
              {karyawanList.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center space-x-3 p-3 hover:bg-[#FFFAF3] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-[#041E3F]/10"
                  onClick={() => toggleKaryawan(emp.id)}
                >
                  <div
                    className={cn(
                      "size-4 shrink-0 rounded-md border border-[#041E3F]/30",
                      selectedKaryawan.includes(emp.id) &&
                        "bg-[#041E3F] text-[#FFFAF3]",
                    )}
                  >
                    {selectedKaryawan.includes(emp.id) && (
                      <Check className="size-3.5" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#041E3F] leading-none">
                      {emp.nama}
                    </span>
                    <span className="text-xs font-semibold text-[#041E3F]/60 mt-1.5">
                      {emp.role}
                    </span>
                  </div>
                </div>
              ))}
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
