"use client";

import { useMemo } from "react";
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
import { CalendarDays, X, Info, Coffee, Briefcase } from "lucide-react";
import type { PolaRosterItem, PolaRosterRequest } from "@/types/pola-roster";
import type { ShiftItem } from "@/types/shift";
import { buatSkemaPolaRoster, type NilaiFormPolaRoster } from "./schema";
import {
  labelShiftPola,
  nilaiAwalPolaRoster,
  payloadPolaRoster,
  sesuaikanRincian,
  teksLabelShift,
  terimaKetikanSiklus,
} from "./payload";

interface PolaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget: PolaRosterItem | null;
  shiftList: ShiftItem[];
  onSubmit: (data: PolaRosterRequest) => void;
  isPending?: boolean;
}

interface IsiFormPolaRosterProps {
  editTarget: PolaRosterItem | null;
  shiftList: ShiftItem[];
  onSubmit: (data: PolaRosterRequest) => void;
  isPending: boolean;
}

/**
 * Isi form buat dan ubah pola roster: pesan galat, form, dan tombol simpan.
 * Dipasang setiap kali dialog dibuka, karena DialogContent dilepas saat
 * dialog tertutup, sehingga nilai awal cukup lewat defaultValues tanpa
 * reset di effect (keputusan rancangan butir 8, PL2a). Pilihan shift hanya
 * berisi shift aktif; shift nonaktif yang sudah dipakai pola tampil sebagai
 * pilihan nonaktif agar pengguna menggantinya (PL1a). Siklus di atas batas
 * ditolak, dan rincian baru disesuaikan saat siklus berisi angka sah
 * (PL3a).
 */
function IsiFormPolaRoster({ editTarget, shiftList, onSubmit, isPending }: IsiFormPolaRosterProps) {
  const shiftAktif = useMemo(() => shiftList.filter((s) => s.status === "Aktif"), [shiftList]);
  const idShiftAktif = useMemo(() => new Set(shiftAktif.map((s) => s.id)), [shiftAktif]);
  const skema = useMemo(() => buatSkemaPolaRoster(idShiftAktif), [idShiftAktif]);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<NilaiFormPolaRoster>({
    resolver: zodResolver(skema),
    defaultValues: nilaiAwalPolaRoster(editTarget),
  });
  const rincian = useWatch({ control, name: "detailSiklus" });
  const pesanGalat =
    errors.namaPola?.message ??
    errors.siklus?.message ??
    errors.detailSiklus?.message ??
    errors.detailSiklus?.root?.message;

  const ubahBaris = (index: number, pilihan: string) => {
    const hariKe = getValues(`detailSiklus.${index}.hariKe`);
    setValue(
      `detailSiklus.${index}`,
      pilihan === "libur"
        ? { hariKe, isLibur: true, shiftID: "" }
        : { hariKe, isLibur: false, shiftID: pilihan },
    );
  };

  return (
    <>
      {pesanGalat && (
        <div
          role="alert"
          className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold flex items-center gap-2 mb-4 shrink-0"
        >
          <Info className="h-4 w-4 shrink-0" />
          <p>{pesanGalat}</p>
        </div>
      )}

      <form
        id="pola-form"
        onSubmit={handleSubmit((nilai) => onSubmit(payloadPolaRoster(nilai)))}
        className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8 space-y-2">
            <label htmlFor="nama-pola" className="text-sm font-bold text-[#041E3F]">Nama Pola Roster</label>
            <Input
              id="nama-pola"
              {...register("namaPola")}
              placeholder="Misal: Reguler 5-2"
              className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-bold h-12 rounded-xl px-4"
              required
            />
          </div>
          <div className="sm:col-span-4 space-y-2">
            <label htmlFor="siklus-pola" className="text-sm font-bold text-[#041E3F]">Siklus (Hari)</label>
            <Controller
              control={control}
              name="siklus"
              render={({ field }) => (
                <Input
                  id="siklus-pola"
                  type="text"
                  inputMode="numeric"
                  value={field.value}
                  onChange={(e) => {
                    const teks = terimaKetikanSiklus(field.value, e.target.value);
                    field.onChange(teks);
                    const jumlah = Number(teks);
                    if (teks !== "" && jumlah >= 1) {
                      setValue("detailSiklus", sesuaikanRincian(getValues("detailSiklus"), jumlah));
                    }
                  }}
                  onBlur={field.onBlur}
                  className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-bold h-12 rounded-xl text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  required
                />
              )}
            />
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-[#041E3F]/10">
          <div className="flex items-center justify-between">
            <span id="label-rincian-siklus" className="text-sm font-bold text-[#041E3F]">Rincian Siklus</span>
            <span className="text-xs font-bold text-[#041E3F]/50 bg-[#041E3F]/5 px-2 py-1 rounded-md">
              {rincian.length} Hari Terdeteksi
            </span>
          </div>

          <div role="group" aria-labelledby="label-rincian-siklus" className="flex flex-col gap-2.5">
            {rincian.map((row, index) => {
              const shiftNonaktif = !row.isLibur && row.shiftID !== "" && !idShiftAktif.has(row.shiftID);
              return (
                <div key={row.hariKe} className="flex items-center gap-3 bg-[#FFFAF3] p-2 rounded-xl border border-[#041E3F]/10 shadow-sm transition-all hover:border-[#041E3F]/30">
                  <div className="flex h-10 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-[#041E3F]/5 border border-[#041E3F]/5 text-[#041E3F]">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 leading-none">Hari</span>
                    <span className="text-sm font-black leading-tight">{row.hariKe}</span>
                  </div>

                  <Select
                    value={row.isLibur ? "libur" : row.shiftID}
                    onValueChange={(val) => ubahBaris(index, val)}
                  >
                    <SelectTrigger
                      aria-label={`Shift hari ke-${row.hariKe}`}
                      className="flex-1 bg-transparent border-none shadow-none focus:ring-0 text-[#041E3F] font-bold px-2 h-10 cursor-pointer"
                    >
                      <SelectValue placeholder="Pilih shift..." />
                    </SelectTrigger>

                    <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-bold rounded-xl max-h-56">
                      <SelectItem value="libur" className="cursor-pointer text-red-600 focus:text-red-700">
                        <div className="flex items-center gap-2">
                          <Coffee className="h-4 w-4" /> Libur / Off
                        </div>
                      </SelectItem>

                      {shiftAktif.length > 0 && <div className="h-px bg-[#041E3F]/10 my-1 mx-2" />}

                      {shiftAktif.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 opacity-50" />
                            {shift.namaShift} <span className="font-medium opacity-50 ml-1">({shift.jamMasuk} - {shift.jamPulang})</span>
                          </div>
                        </SelectItem>
                      ))}

                      {shiftNonaktif && (
                        <SelectItem value={row.shiftID} disabled className="cursor-not-allowed">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 opacity-50" />
                            {teksLabelShift(labelShiftPola({ shiftID: row.shiftID }, shiftList))}
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      </form>

      <div className="pt-4 mt-2 border-t border-[#041E3F]/10 shrink-0">
        <Button
          type="submit"
          form="pola-form"
          disabled={isPending || rincian.length === 0}
          className="w-full h-14 rounded-xl cursor-pointer bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 text-base font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Menyimpan..." : "Simpan Pola Roster"}
        </Button>
      </div>
    </>
  );
}

export function PolaFormDialog({
  open,
  onOpenChange,
  editTarget,
  shiftList,
  onSubmit,
  isPending = false,
}: PolaFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-137.5 border-[#041E3F]/10 bg-[#F2EAE1] p-6 sm:p-8 [&>button]:hidden rounded-[1.5rem] shadow-xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-start justify-between mb-2 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] text-[#041E3F]">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-[#041E3F]">
                {editTarget ? "Edit Pola Roster" : "Buat Pola Roster"}
              </DialogTitle>
              <DialogDescription className="text-sm font-semibold text-[#041E3F]/60 mt-0.5">
                Rancang template siklus hari kerja karyawan.
              </DialogDescription>
            </div>
          </div>
          <button
            aria-label="Tutup"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center p-2 rounded-md text-[#041E3F] hover:bg-[#041E3F]/10 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </div>

        <IsiFormPolaRoster
          key={editTarget?.id ?? "baru"}
          editTarget={editTarget}
          shiftList={shiftList}
          onSubmit={onSubmit}
          isPending={isPending}
        />
        
      </DialogContent>
    </Dialog>
  );
}