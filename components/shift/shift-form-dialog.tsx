"use client";

import React, { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, X, Info, MoonStar, Clock3 } from "lucide-react";
import { ShiftRequest, ShiftItem } from "@/types/shift";

interface ShiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: ShiftItem | null;
  onSubmit: (data: ShiftRequest) => void;
  isPending?: boolean;
}

export function ShiftFormDialog({
  open,
  onOpenChange,
  editTarget,
  onSubmit,
  isPending = false,
}: ShiftFormDialogProps) {
  // --- STATE FORM (Dipecah agar lebih fleksibel) ---
  const [namaShift, setNamaShift] = useState("");

  // State Jam Kustom (String 2 digit)
  const [masukHour, setMasukHour] = useState("");
  const [masukMinute, setMasukMinute] = useState("");
  const [pulangHour, setPulangHour] = useState("");
  const [pulangMinute, setPulangMinute] = useState("");

  const [isLintasHari, setIsLintasHari] = useState(false);

  // Menggunakan STRING agar bisa "Kosong", bukan angka 0.
  const [toleransiStr, setToleransiStr] = useState("");

  const [status, setStatus] = useState<"Aktif" | "Non-Aktif">("Aktif");
  const [errorMsg, setErrorMsg] = useState("");

  // --- EFEK: ISI DATA SAAT DIBUKA ---
  useEffect(() => {
    if (open) {
      if (editTarget) {
        setNamaShift(editTarget.namaShift);

        // Ekstrak HH dan mm dari data edit (Misal: "08:00")
        const [mH, mM] = editTarget.jamMasuk.split(":");
        setMasukHour(mH || "");
        setMasukMinute(mM || "");

        const [pH, pM] = editTarget.jamPulang.split(":");
        setPulangHour(pH || "");
        setPulangMinute(pM || "");

        setIsLintasHari(editTarget.isLintasHari);

        // Jika 0, ubah jadi string kosong agar field bersih saat mau diedit
        setToleransiStr(
          editTarget.toleransiTerlambat === 0
            ? ""
            : String(editTarget.toleransiTerlambat),
        );

        setStatus(editTarget.status);
      } else {
        // Reset form kosongan
        setNamaShift("");
        setMasukHour("");
        setMasukMinute("");
        setPulangHour("");
        setPulangMinute("");
        setIsLintasHari(false);
        setToleransiStr("");
        setStatus("Aktif");
      }
      setErrorMsg("");
    }
  }, [open, editTarget]);

  // --- UX CERDAS: OTOMATIS CENTANG LINTAS HARI ---
  useEffect(() => {
    if (masukHour && masukMinute && pulangHour && pulangMinute) {
      const mH = parseInt(masukHour) || 0;
      const mM = parseInt(masukMinute) || 0;
      const pH = parseInt(pulangHour) || 0;
      const pM = parseInt(pulangMinute) || 0;

      // Jika total menit jam pulang <= jam masuk, otomatis ini lintas hari
      if (pH * 60 + pM <= mH * 60 + mM) {
        setIsLintasHari(true);
      }
    }
  }, [masukHour, masukMinute, pulangHour, pulangMinute]);

  // --- HANDLER VALIDASI KETIKAN JAM ---
  const handleTimeChange = (
    val: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    maxLimit: number,
  ) => {
    // Cegah huruf/karakter aneh masuk, hanya terima angka
    const onlyNumbers = val.replace(/\D/g, "");
    if (onlyNumbers === "") {
      setter("");
      return;
    }

    // Cegah angka melebihi batas (Jam max 23, Menit max 59)
    const num = parseInt(onlyNumbers, 10);
    if (num > maxLimit) {
      setter(String(maxLimit));
    } else {
      setter(onlyNumbers);
    }
  };

  // --- HANDLER SUBMIT ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // 1. Validasi Kehadiran Input
    if (!namaShift.trim()) return setErrorMsg("Nama shift wajib diisi.");
    if (!masukHour || !masukMinute)
      return setErrorMsg("Isi jam masuk dengan lengkap.");
    if (!pulangHour || !pulangMinute)
      return setErrorMsg("Isi jam pulang dengan lengkap.");

    // 2. Pad dengan 0 jika HRD hanya mengetik 1 angka (Misal: '8' jadi '08')
    const finalMasukHour = masukHour.padStart(2, "0");
    const finalMasukMinute = masukMinute.padStart(2, "0");
    const finalPulangHour = pulangHour.padStart(2, "0");
    const finalPulangMinute = pulangMinute.padStart(2, "0");

    // 3. Fallback jika toleransi kosong -> 0
    const finalToleransi = parseInt(toleransiStr) || 0;
    if (finalToleransi < 0)
      return setErrorMsg("Toleransi tidak boleh negatif.");

    // 4. Rakit payload
    const payload: ShiftRequest = {
      namaShift,
      jamMasuk: `${finalMasukHour}:${finalMasukMinute}`,
      jamPulang: `${finalPulangHour}:${finalPulangMinute}`,
      isLintasHari,
      toleransiTerlambat: finalToleransi,
      status,
    };

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125 border-[#041E3F]/10 bg-[#F2EAE1] p-6 sm:p-8 [&>button]:hidden rounded-[1.5rem] shadow-xl">
        {/* CUSTOM HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] text-[#041E3F]">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-[#041E3F]">
                {editTarget ? "Edit Master Shift" : "Tambah Shift Baru"}
              </DialogTitle>
              <DialogDescription className="text-sm font-semibold text-[#041E3F]/60 mt-0.5">
                Atur jam kerja operasional karyawan.
              </DialogDescription>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center p-2 rounded-md text-[#041E3F] hover:bg-[#041E3F]/10 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* 1. NAMA SHIFT */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#041E3F]">
              Nama Shift
            </label>
            <Input
              value={namaShift}
              onChange={(e) => setNamaShift(e.target.value)}
              placeholder="Contoh: Shift Pagi"
              className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-bold h-12 rounded-xl px-4"
              required
            />
          </div>

          {/* 2. JAM MASUK & PULANG (Custom Time Input) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Field Jam Masuk */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">
                Jam Masuk
              </label>
              <div className="flex h-12 w-full items-center gap-2 rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] px-3 focus-within:ring-1 focus-within:ring-[#041E3F]/50 transition-shadow">
                <Clock3 className="h-4 w-4 text-[#041E3F]/40" />

                {/* Input Jam (00-23) */}
                <input
                  type="text"
                  maxLength={2}
                  placeholder="--"
                  className="w-10 bg-transparent text-center font-bold text-[#041E3F] outline-none placeholder:text-[#041E3F]/20"
                  value={masukHour}
                  onChange={(e) =>
                    handleTimeChange(e.target.value, setMasukHour, 23)
                  }
                  onBlur={() =>
                    masukHour && setMasukHour((p) => p.padStart(2, "0"))
                  }
                />

                <span className="font-bold text-[#041E3F]/50">:</span>

                {/* Input Menit (00-59) */}
                <input
                  type="text"
                  maxLength={2}
                  placeholder="--"
                  className="w-10 bg-transparent text-center font-bold text-[#041E3F] outline-none placeholder:text-[#041E3F]/20"
                  value={masukMinute}
                  onChange={(e) =>
                    handleTimeChange(e.target.value, setMasukMinute, 59)
                  }
                  onBlur={() =>
                    masukMinute && setMasukMinute((p) => p.padStart(2, "0"))
                  }
                />
              </div>
            </div>

            {/* Field Jam Pulang */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">
                Jam Pulang
              </label>
              <div className="flex h-12 w-full items-center gap-2 rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] px-3 focus-within:ring-1 focus-within:ring-[#041E3F]/50 transition-shadow">
                <Clock3 className="h-4 w-4 text-[#041E3F]/40" />

                {/* Input Jam (00-23) */}
                <input
                  type="text"
                  maxLength={2}
                  placeholder="--"
                  className="w-10 bg-transparent text-center font-bold text-[#041E3F] outline-none placeholder:text-[#041E3F]/20"
                  value={pulangHour}
                  onChange={(e) =>
                    handleTimeChange(e.target.value, setPulangHour, 23)
                  }
                  onBlur={() =>
                    pulangHour && setPulangHour((p) => p.padStart(2, "0"))
                  }
                />

                <span className="font-bold text-[#041E3F]/50">:</span>

                {/* Input Menit (00-59) */}
                <input
                  type="text"
                  maxLength={2}
                  placeholder="--"
                  className="w-10 bg-transparent text-center font-bold text-[#041E3F] outline-none placeholder:text-[#041E3F]/20"
                  value={pulangMinute}
                  onChange={(e) =>
                    handleTimeChange(e.target.value, setPulangMinute, 59)
                  }
                  onBlur={() =>
                    pulangMinute && setPulangMinute((p) => p.padStart(2, "0"))
                  }
                />
              </div>
            </div>
          </div>

          {/* 3. LINTAS HARI CHECKBOX */}
          <div className="flex items-center space-x-3 p-4 border border-[#041E3F]/15 bg-[#FFFAF3] rounded-xl shadow-sm">
            <Checkbox
              id="lintas-hari"
              checked={isLintasHari}
              onCheckedChange={(checked) => setIsLintasHari(!!checked)}
              className="border-[#041E3F]/30 data-[state=checked]:bg-[#041E3F] data-[state=checked]:text-[#FFFAF3] rounded-md h-5 w-5 mt-0.5"
            />
            <div className="flex flex-col">
              <label
                htmlFor="lintas-hari"
                className="text-sm font-bold cursor-pointer text-[#041E3F] flex items-center gap-1.5"
              >
                Shift Malam (Lintas Hari){" "}
                <MoonStar className="h-4 w-4 text-[#041E3F]/70" />
              </label>
              <p className="text-xs text-[#041E3F]/50 font-semibold mt-0.5">
                Centang jika jam pulang melewati tengah malam (keesokan
                harinya).
              </p>
            </div>
          </div>

          {/* 4. TOLERANSI TERLAMBAT (No-spinner, string kosong untuk default) */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#041E3F]">
              Toleransi Keterlambatan
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                value={toleransiStr}
                onChange={(e) => setToleransiStr(e.target.value)}
                placeholder="0"
                /* 
                  CLASS PENGHILANG SPINNER BROWSER:
                  [appearance:textfield] & pseudo-classes webkit
                */
                className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-bold h-12 rounded-xl pl-4 pr-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#041E3F]/50">
                Menit
              </span>
            </div>
          </div>

          {/* 5. STATUS SHIFT (Muncul saat edit mode saja) */}
          {editTarget && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#041E3F]">
                Status Master Shift
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as "Aktif" | "Non-Aktif")}
              >
                <SelectTrigger className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-bold h-12 rounded-xl px-4">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-bold rounded-xl">
                  <SelectItem value="Aktif" className="cursor-pointer">
                    Aktif / Berjalan
                  </SelectItem>
                  <SelectItem
                    value="Non-Aktif"
                    className="cursor-pointer text-red-600 focus:text-red-700"
                  >
                    Non-Aktif (Diarsipkan)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 6. SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-14 mt-2 rounded-xl cursor-pointer bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 text-base font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Menyimpan..." : "Simpan Master Shift"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
