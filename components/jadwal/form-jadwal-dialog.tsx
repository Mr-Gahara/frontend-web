"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarPlus,
  X,
  Briefcase,
  Coffee,
  Plus,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import { Calendar } from "@/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ShiftItem,
  MasterShiftItem,
  KaryawanJadwal,
  JadwalManualPayload,
  JadwalUpdatePayload,
} from "@/types/jadwal";

interface FormJadwalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penggunaId: string | null;
  namaKaryawan: string;
  tanggal: Date | null;
  existingShifts?: ShiftItem[];
  masterShiftList: MasterShiftItem[];
  karyawanList?: KaryawanJadwal[];
  onSubmit?: (data: JadwalManualPayload) => void;
  onUpdate?: (id: string, data: JadwalUpdatePayload) => void;
  onDelete?: (id: string) => void;
  isPending?: boolean;
}

export function FormJadwalDialog({
  open,
  onOpenChange,
  penggunaId,
  namaKaryawan,
  tanggal,
  existingShifts = [],
  masterShiftList,
  karyawanList = [],
  onSubmit,
  onUpdate,
  onDelete,
  isPending = false,
}: FormJadwalDialogProps) {
  const [statusKehadiran, setStatusKehadiran] = useState<"kerja" | "libur">(
    "kerja",
  );
  const [selectedShifts, setSelectedShifts] = useState<string[]>([""]);
  const [catatan, setCatatan] = useState("");
  const [selectedPenggunaId, setSelectedPenggunaId] = useState<string>("");
  const [selectedTanggal, setSelectedTanggal] = useState<Date | undefined>(
    undefined,
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // LOGIKA EDIT MODE PINTAR
  const isEditMode =
    existingShifts.length > 0 && existingShifts[0].id !== "off";
  const targetJadwalId = isEditMode ? existingShifts[0].id : null;

  useEffect(() => {
    if (open) {
      if (existingShifts.length > 0 && existingShifts[0].id !== "off") {
        const isLibur = existingShifts[0].type === "off";
        setStatusKehadiran(isLibur ? "libur" : "kerja");

        if (isLibur) {
          setSelectedShifts([""]);
        } else {
          // Cukup panggil masterShiftId yang sudah dipasang di page.tsx
          const mappedShifts = existingShifts.map((s) => s.masterShiftId || "");
          setSelectedShifts(mappedShifts.length > 0 ? mappedShifts : [""]);
        }
      } else {
        setStatusKehadiran("kerja");
        setSelectedShifts([""]);
      }
      setCatatan("");
      setSelectedPenggunaId(penggunaId || "");
      setSelectedTanggal(tanggal ?? undefined);
      setIsCalendarOpen(false);
    }
  }, [open, existingShifts, penggunaId, tanggal]);

  const addShiftRow = () => setSelectedShifts([...selectedShifts, ""]);
  const removeShiftRow = (index: number) => {
    const updated = [...selectedShifts];
    updated.splice(index, 1);
    setSelectedShifts(updated);
  };
  const handleShiftChange = (value: string, index: number) => {
    const updated = [...selectedShifts];
    updated[index] = value;
    setSelectedShifts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedPenggunaId = penggunaId || selectedPenggunaId;
    const resolvedTanggal = tanggal || selectedTanggal;

    if (!resolvedPenggunaId || !resolvedTanggal) return;

    try {
      if (isEditMode) {
        if (statusKehadiran === "libur") {
          // 1. Jadikan jadwal pertama libur, lalu hapus sisa split shift (jika ada)
          if (onUpdate)
            await onUpdate(existingShifts[0].id, {
              isLibur: true,
              shiftID: null,
              catatan,
            });
          if (onDelete) {
            for (let i = 1; i < existingShifts.length; i++) {
              await onDelete(existingShifts[i].id);
            }
          }
        } else {
          // 2. Status Kerja: Sinkronisasi Split Shift
          const validShifts = selectedShifts.filter((s) => s !== "");

          for (let i = 0; i < existingShifts.length; i++) {
            if (i < validShifts.length) {
              // Update jadwal lama dengan master shift yang baru dipilih
              if (onUpdate)
                await onUpdate(existingShifts[i].id, {
                  isLibur: false,
                  shiftID: validShifts[i],
                  catatan,
                });
            } else {
              // Hapus jadwal lama jika kotak Split Shift dibuang oleh HRD
              if (onDelete) await onDelete(existingShifts[i].id);
            }
          }

          // 3. Jika ada tambahan Split Shift BARU, Buat record baru (POST)
          if (validShifts.length > existingShifts.length && onSubmit) {
            const newShifts = validShifts.slice(existingShifts.length);
            await onSubmit({
              penggunaId: resolvedPenggunaId,
              tanggal: format(resolvedTanggal, "yyyy-MM-dd"),
              isLibur: false,
              shiftIds: newShifts,
              catatan,
            });
          }
        }
      } else if (onSubmit) {
        // Mode Create Baru (Normal)
        await onSubmit({
          penggunaId: resolvedPenggunaId,
          tanggal: format(resolvedTanggal, "yyyy-MM-dd"),
          isLibur: statusKehadiran === "libur",
          shiftIds:
            statusKehadiran === "kerja"
              ? selectedShifts.filter((s) => s !== "")
              : [],
          catatan,
        });
      }

      // ✅ Tutup modal otomatis HANYA JIKA seluruh proses mutasi API sukses tanpa lempar Error
      onOpenChange(false);
    } catch (error) {
      console.error("Operasi jadwal gagal:", error);
      // Toast error otomatis muncul dari page.tsx dan form tidak akan menutup
    }
  };

  const formatTanggal = tanggal
    ? tanggal.toLocaleString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 border-[#041E3F]/10 bg-[#F2EAE1] p-6 sm:p-8 [&>button]:hidden rounded-[1.5rem] shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] text-[#041E3F]">
              <CalendarPlus className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-2xl font-bold text-[#041E3F]">
                {isEditMode ? "Ubah Jadwal" : "Kelola Jadwal"}
              </DialogTitle>
              <DialogDescription className="text-sm font-semibold text-[#041E3F]/60 mt-0.5">
                {isEditMode
                  ? `${namaKaryawan} • ${formatTanggal}`
                  : "Tambahkan jadwal shift baru untuk karyawan."}
              </DialogDescription>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center p-2 rounded-md text-[#041E3F] hover:bg-[#041E3F]/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {!isEditMode && !penggunaId && (
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#041E3F]">
                  Pilih Karyawan
                </label>
                <Select
                  value={selectedPenggunaId}
                  onValueChange={setSelectedPenggunaId}
                >
                  <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 font-bold h-12 rounded-xl px-4">
                    <SelectValue placeholder="Pilih karyawan..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl">
                    {karyawanList.map((k) => (
                      <SelectItem
                        key={k.id}
                        value={k.id}
                        className="cursor-pointer font-bold"
                      >
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#041E3F]">
                  Pilih Tanggal
                </label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`w-full flex items-center gap-3 bg-[#FFFAF3] border border-[#041E3F]/15 h-12 rounded-xl px-4 text-sm font-bold ${!selectedTanggal ? "text-[#041E3F]/40" : "text-[#041E3F]"}`}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0" />
                      {selectedTanggal
                        ? format(selectedTanggal, "EEEE, d MMMM yyyy", {
                            locale: localeId,
                          })
                        : "Pilih tanggal..."}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 border-none shadow-xl"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={selectedTanggal}
                      onSelect={(date) => {
                        setSelectedTanggal(date);
                        setIsCalendarOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <label className="text-sm font-bold text-[#041E3F]">
              Status Kehadiran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setStatusKehadiran("kerja")}
                className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer ${statusKehadiran === "kerja" ? "bg-[#041E3F] border-[#041E3F] text-[#FFFAF3] shadow-md" : "bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] hover:border-[#041E3F]/40"}`}
              >
                <Briefcase
                  className={`h-6 w-6 mb-2 ${statusKehadiran === "kerja" ? "stroke-[2.5px]" : "stroke-[2px]"}`}
                />
                <span className="text-sm font-bold">Shift Kerja</span>
              </div>
              <div
                onClick={() => setStatusKehadiran("libur")}
                className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer ${statusKehadiran === "libur" ? "bg-[#041E3F] border-[#041E3F] text-[#FFFAF3] shadow-md" : "bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] hover:border-[#041E3F]/40"}`}
              >
                <Coffee
                  className={`h-6 w-6 mb-2 ${statusKehadiran === "libur" ? "stroke-[2.5px]" : "stroke-[2px]"}`}
                />
                <span className="text-sm font-bold">Libur / Off</span>
              </div>
            </div>
          </div>

          {statusKehadiran === "kerja" && (
            <div className="space-y-3 p-4 bg-[#041E3F]/3 border border-[#041E3F]/10 rounded-xl">
              <label className="text-sm font-bold text-[#041E3F]">
                Pilih Master Shift
              </label>
              {selectedShifts.map((shiftValue, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={shiftValue}
                    onValueChange={(val) => handleShiftChange(val, index)}
                    required
                  >
                    <SelectTrigger className="flex-1 bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 font-bold h-12 rounded-xl px-4">
                      <SelectValue placeholder="Pilih shift..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl">
                      {masterShiftList.map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.id}
                          className="cursor-pointer font-bold"
                        >
                          {s.nama} ({s.jam})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* ✅ FIX 3: KEMBALIKAN TOMBOL HAPUS BARIS MESKIPUN DI MODE EDIT */}
                  {selectedShifts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeShiftRow(index)}
                      className="h-12 w-12 rounded-xl text-red-500 hover:bg-red-500/10 shrink-0"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              ))}

              {/* ✅ FIX 4: KEMBALIKAN TOMBOL TAMBAH SPLIT SHIFT MESKIPUN DI MODE EDIT */}
              <Button
                type="button"
                variant="ghost"
                onClick={addShiftRow}
                className="w-full mt-1 border border-dashed border-[#041E3F]/20 text-[#041E3F]/70 font-bold h-10 rounded-xl hover:bg-[#041E3F]/5"
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Split Shift
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-[#041E3F]">
              Catatan Khusus{" "}
              <span className="text-[#041E3F]/50 font-semibold">
                (Opsional)
              </span>
            </label>
            <Textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: Menggantikan shift Andi..."
              className="bg-[#FFFAF3] border-[#041E3F]/15 font-medium rounded-xl px-4 py-3 resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
            {/* ✅ FIX 5: UI TOMBOL DELETE UTAMA DI-STYLING ULANG AGAR PROPORSIONAL */}
            {isEditMode && targetJadwalId && (
              <Button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (
                    confirm("Apakah Anda yakin ingin menghapus jadwal ini?")
                  ) {
                    onDelete?.(targetJadwalId);
                  }
                }}
                className="h-14 px-5 rounded-xl font-bold shadow-md bg-rose-800 hover:bg-red-900 flex items-center justify-center gap-2"
              >
                <Trash2 className="h-5 w-5" />
                <span>Hapus</span>
              </Button>
            )}

            <Button
              type="submit"
              disabled={
                isPending ||
                (!isEditMode && !selectedPenggunaId && !penggunaId) ||
                (!isEditMode && !selectedTanggal && !tanggal) ||
                (statusKehadiran === "kerja" && !selectedShifts[0])
              }
              className="flex-1 h-14 rounded-xl bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 text-base font-bold shadow-md"
            >
              {isPending
                ? "Memproses..."
                : isEditMode
                  ? "Simpan Perubahan"
                  : "Simpan Jadwal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
