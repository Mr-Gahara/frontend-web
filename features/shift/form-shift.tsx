"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { InputWaktu } from "@/components/input-waktu";
import { gabungTeksWaktu, pisahTeksWaktu } from "@/lib/waktu";
import { Clock, X, Info, MoonStar } from "lucide-react";
import type { ShiftItem, StatusShift } from "@/types/shift";
import { skemaShift, type NilaiFormShift } from "./schema";
import { hitungLintasHari, nilaiAwalShift } from "./payload";

interface ShiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: ShiftItem | null;
  onSubmit: (nilai: NilaiFormShift) => void;
  isPending?: boolean;
}

interface IsiFormShiftProps {
  editTarget: ShiftItem | null;
  onSubmit: (nilai: NilaiFormShift) => void;
  isPending: boolean;
}

/**
 * Isi form buat dan ubah master shift. Dipasang setiap kali dialog dibuka,
 * karena DialogContent dilepas saat dialog tertutup, sehingga nilai awal
 * cukup lewat defaultValues, tanpa reset di effect (keputusan rancangan
 * butir 8). Lintas hari dihitung dari jam dan tidak dapat diubah
 * (keputusan SH2a). Atribut required dan min dipertahankan dari form lama.
 */
function IsiFormShift({ editTarget, onSubmit, isPending }: IsiFormShiftProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiFormShift>({
    resolver: zodResolver(skemaShift),
    defaultValues: nilaiAwalShift(editTarget),
  });
  const [jamMasuk, jamPulang] = useWatch({ control, name: ["jamMasuk", "jamPulang"] });
  const isLintasHari = hitungLintasHari(jamMasuk, jamPulang);
  const pesanGalat =
    errors.namaShift?.message ??
    errors.jamMasuk?.message ??
    errors.jamPulang?.message ??
    errors.toleransi?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      {pesanGalat && (
        <div
          role="alert"
          className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2"
        >
          <Info className="h-4 w-4 shrink-0" />
          <p>{pesanGalat}</p>
        </div>
      )}

      {/* 1. NAMA SHIFT */}
      <div className="space-y-2">
        <label htmlFor="nama-shift" className="text-sm font-bold text-[#041E3F]">
          Nama Shift
        </label>
        <Input
          id="nama-shift"
          {...register("namaShift")}
          placeholder="Contoh: Shift Pagi"
          className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-bold h-12 rounded-xl px-4"
          required
        />
      </div>

      {/* 2. JAM MASUK & PULANG (InputWaktu, keputusan rancangan butir 22) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="jam-masuk-shift" className="text-sm font-bold text-[#041E3F]">
            Jam Masuk
          </label>
          <Controller
            control={control}
            name="jamMasuk"
            render={({ field, fieldState }) => (
              <InputWaktu
                id="jam-masuk-shift"
                label="Jam Masuk"
                value={pisahTeksWaktu(field.value)}
                onChange={(waktu) => field.onChange(gabungTeksWaktu(waktu))}
                invalid={!!fieldState.error}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="jam-pulang-shift" className="text-sm font-bold text-[#041E3F]">
            Jam Pulang
          </label>
          <Controller
            control={control}
            name="jamPulang"
            render={({ field, fieldState }) => (
              <InputWaktu
                id="jam-pulang-shift"
                label="Jam Pulang"
                value={pisahTeksWaktu(field.value)}
                onChange={(waktu) => field.onChange(gabungTeksWaktu(waktu))}
                invalid={!!fieldState.error}
              />
            )}
          />
        </div>
      </div>

      {/* 3. LINTAS HARI, dihitung dari jam (keputusan SH2a) */}
      <div className="flex items-center space-x-3 p-4 border border-[#041E3F]/15 bg-[#FFFAF3] rounded-xl shadow-sm">
        <Checkbox
          id="lintas-hari"
          checked={isLintasHari}
          disabled
          aria-describedby="keterangan-lintas-hari"
          className="border-[#041E3F]/30 data-[state=checked]:bg-[#041E3F] data-[state=checked]:text-[#FFFAF3] rounded-md h-5 w-5 mt-0.5"
        />
        <div className="flex flex-col">
          <label
            htmlFor="lintas-hari"
            className="text-sm font-bold cursor-default text-[#041E3F] flex items-center gap-1.5"
          >
            Shift Malam (Lintas Hari){" "}
            <MoonStar className="h-4 w-4 text-[#041E3F]/70" />
          </label>
          <p id="keterangan-lintas-hari" className="text-xs text-[#041E3F]/50 font-semibold mt-0.5">
            Terisi otomatis bila jam pulang tidak lebih besar dari jam masuk
            (pulang keesokan harinya).
          </p>
        </div>
      </div>

      {/* 4. TOLERANSI TERLAMBAT (No-spinner, string kosong untuk default) */}
      <div className="space-y-2">
        <label htmlFor="toleransi-shift" className="text-sm font-bold text-[#041E3F]">
          Toleransi Keterlambatan
        </label>
        <div className="relative">
          <Input
            id="toleransi-shift"
            type="number"
            min="0"
            {...register("toleransi")}
            placeholder="0"
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
          <label htmlFor="status-shift" className="text-sm font-bold text-[#041E3F]">
            Status Master Shift
          </label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val) => field.onChange(val as StatusShift)}
              >
                <SelectTrigger
                  id="status-shift"
                  className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-bold h-12 rounded-xl px-4"
                >
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
            )}
          />
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
  );
}

export function ShiftFormDialog({
  open,
  onOpenChange,
  editTarget,
  onSubmit,
  isPending = false,
}: ShiftFormDialogProps) {
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
            aria-label="Batal"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center p-2 rounded-md text-[#041E3F] hover:bg-[#041E3F]/10 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </div>

        <IsiFormShift
          key={editTarget?.id ?? "baru"}
          editTarget={editTarget}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
