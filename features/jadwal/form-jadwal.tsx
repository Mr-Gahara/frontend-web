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
import { Textarea } from "@/components/ui/textarea";
import { CalendarPlus, X, Briefcase, Coffee, Plus, Trash2 } from "lucide-react";
import { PilihTanggal } from "@/components/pilih-tanggal";
import { keTanggalLokal } from "@/lib/waktu";
import { buatSkemaJadwalManual, type NilaiFormJadwal } from "./schema";
import type { PayloadJadwalManual } from "./tipe";
import type { KaryawanJadwal, ShiftItem } from "@/types/jadwal";
import type { ShiftItem as MasterShift } from "@/types/shift";

interface FormJadwalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penggunaId: string | null;
  namaKaryawan: string;
  tanggal: Date | null;
  existingShifts?: ShiftItem[];
  shiftList: MasterShift[];
  karyawanList?: KaryawanJadwal[];
  onSimpan: (payload: PayloadJadwalManual) => Promise<void>;
  onHapus: (id: string) => Promise<void>;
  isPending?: boolean;
}

interface IsiFormJadwalProps {
  penggunaId: string | null;
  tanggal: Date | null;
  existingShifts: ShiftItem[];
  shiftList: MasterShift[];
  karyawanList: KaryawanJadwal[];
  isEditMode: boolean;
  onSimpan: (payload: PayloadJadwalManual) => Promise<void>;
  onHapus: (id: string) => Promise<void>;
  onSelesai: () => void;
  isPending: boolean;
}

/**
 * Isi form buat dan ubah jadwal satu karyawan di satu hari (keputusan
 * JD8a). Dipasang setiap kali dialog dibuka, karena DialogContent dilepas
 * saat dialog tertutup, sehingga nilai awal cukup lewat defaultValues tanpa
 * effect pengisi ulang (butir 8). Nilai awal ubah memuat catatan tersimpan
 * (JD4). Pilihan shift hanya berisi shift aktif; shift nonaktif yang sudah
 * dipakai jadwal tampil sebagai pilihan nonaktif berpenanda (JD7). Galat
 * simpan dan penolakan backend ditampilkan halaman lewat toast, dan dialog
 * bertahan (J2a, keputusan Fase 0).
 */
function IsiFormJadwal({
  penggunaId,
  tanggal,
  existingShifts,
  shiftList,
  karyawanList,
  isEditMode,
  onSimpan,
  onHapus,
  onSelesai,
  isPending,
}: IsiFormJadwalProps) {
  const shiftAktif = useMemo(() => shiftList.filter((s) => s.status === "Aktif"), [shiftList]);
  const skema = useMemo(
    () => buatSkemaJadwalManual(new Set(shiftAktif.map((s) => s.id))),
    [shiftAktif],
  );
  const liburTersimpan =
    isEditMode && (existingShifts[0].isLibur ?? existingShifts[0].type === "off");
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<NilaiFormJadwal>({
    resolver: zodResolver(skema),
    defaultValues: {
      penggunaId: penggunaId ?? "",
      tanggal: tanggal ?? undefined,
      status: liburTersimpan ? "libur" : "kerja",
      shiftIds:
        isEditMode && !liburTersimpan
          ? existingShifts.map((s) => s.masterShiftId ?? "")
          : [""],
      catatan: isEditMode ? (existingShifts[0].catatan ?? "") : "",
    },
  });
  const [status, shiftIds, penggunaTerpilih, tanggalTerpilih] = useWatch({
    control,
    name: ["status", "shiftIds", "penggunaId", "tanggal"],
  });
  const pesanGalat =
    errors.penggunaId?.message ??
    errors.tanggal?.message ??
    errors.shiftIds?.message ??
    errors.shiftIds?.root?.message;
  const targetJadwalId = isEditMode ? existingShifts[0].id : null;

  const ubahShift = (index: number, nilai: string) => {
    const baru = [...getValues("shiftIds")];
    baru[index] = nilai;
    setValue("shiftIds", baru);
  };
  const tambahBaris = () => setValue("shiftIds", [...getValues("shiftIds"), ""]);
  const buangBaris = (index: number) =>
    setValue("shiftIds", getValues("shiftIds").filter((_, i) => i !== index));

  const namaShiftNonaktif = (id: string) => {
    const shift = shiftList.find((s) => s.id === id);
    if (shift) return `${shift.namaShift} (${shift.jamMasuk} - ${shift.jamPulang}) (nonaktif)`;
    const lama = existingShifts.find((s) => s.masterShiftId === id);
    return `${lama?.name ?? "Shift"} (nonaktif)`;
  };

  const kirim = handleSubmit(async (nilai) => {
    try {
      await onSimpan({
        penggunaId: nilai.penggunaId,
        tanggal: keTanggalLokal(nilai.tanggal as Date),
        isLibur: nilai.status === "libur",
        shiftIds: nilai.status === "kerja" ? nilai.shiftIds.filter((s) => s !== "") : [],
        catatan: nilai.catatan,
      });
      onSelesai();
    } catch {
      // Galat dan penolakan sudah ditampilkan halaman; dialog bertahan.
    }
  });

  const hapus = async (id: string) => {
    try {
      await onHapus(id);
      onSelesai();
    } catch {
      // Galat sudah ditampilkan halaman; dialog bertahan.
    }
  };

  return (
    <form onSubmit={kirim} className="flex flex-col gap-6">
      {pesanGalat && (
        <div
          role="alert"
          className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200 text-sm font-bold"
        >
          {pesanGalat}
        </div>
      )}

      {!isEditMode && !penggunaId && (
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label htmlFor="karyawan-jadwal" className="text-sm font-bold text-[#041E3F]">
              Pilih Karyawan
            </label>
            <Controller
              control={control}
              name="penggunaId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="karyawan-jadwal"
                    className="w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 font-bold h-12 rounded-xl px-4"
                  >
                    <SelectValue placeholder="Pilih karyawan..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl">
                    {karyawanList.map((k) => (
                      <SelectItem key={k.id} value={k.id} className="cursor-pointer font-bold">
                        {k.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="tanggal-jadwal" className="text-sm font-bold text-[#041E3F]">
              Pilih Tanggal
            </label>
            <Controller
              control={control}
              name="tanggal"
              render={({ field }) => (
                <PilihTanggal
                  id="tanggal-jadwal"
                  label="Pilih Tanggal"
                  placeholder="Pilih tanggal..."
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <span id="label-status-jadwal" className="text-sm font-bold text-[#041E3F]">
          Status Kehadiran
        </span>
        <div role="group" aria-labelledby="label-status-jadwal" className="grid grid-cols-2 gap-3">
          <button
            type="button"
            aria-pressed={status === "kerja"}
            onClick={() => setValue("status", "kerja")}
            className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer ${status === "kerja" ? "bg-[#041E3F] border-[#041E3F] text-[#FFFAF3] shadow-md" : "bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] hover:border-[#041E3F]/40"}`}
          >
            <Briefcase
              className={`h-6 w-6 mb-2 ${status === "kerja" ? "stroke-[2.5px]" : "stroke-[2px]"}`}
            />
            <span className="text-sm font-bold">Shift Kerja</span>
          </button>
          <button
            type="button"
            aria-pressed={status === "libur"}
            onClick={() => setValue("status", "libur")}
            className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all cursor-pointer ${status === "libur" ? "bg-[#041E3F] border-[#041E3F] text-[#FFFAF3] shadow-md" : "bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] hover:border-[#041E3F]/40"}`}
          >
            <Coffee
              className={`h-6 w-6 mb-2 ${status === "libur" ? "stroke-[2.5px]" : "stroke-[2px]"}`}
            />
            <span className="text-sm font-bold">Libur / Off</span>
          </button>
        </div>
      </div>

      {status === "kerja" && (
        <div className="space-y-3 p-4 bg-[#041E3F]/3 border border-[#041E3F]/10 rounded-xl">
          <span className="text-sm font-bold text-[#041E3F]">Pilih Master Shift</span>
          {shiftIds.map((nilai, index) => {
            const nonaktif = nilai !== "" && !shiftAktif.some((s) => s.id === nilai);
            return (
              <div key={index} className="flex items-center gap-2">
                <Select value={nilai} onValueChange={(val) => ubahShift(index, val)}>
                  <SelectTrigger
                    aria-label={`Shift ${index + 1}`}
                    className="flex-1 bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 font-bold h-12 rounded-xl px-4"
                  >
                    <SelectValue placeholder="Pilih shift..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium rounded-xl">
                    {shiftAktif.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="cursor-pointer font-bold">
                        {s.namaShift} ({s.jamMasuk} - {s.jamPulang})
                      </SelectItem>
                    ))}
                    {nonaktif && (
                      <SelectItem value={nilai} disabled className="cursor-not-allowed font-bold">
                        {namaShiftNonaktif(nilai)}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {shiftIds.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Buang shift ${index + 1}`}
                    onClick={() => buangBaris(index)}
                    className="h-12 w-12 rounded-xl text-red-500 hover:bg-red-500/10 shrink-0"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="ghost"
            onClick={tambahBaris}
            className="w-full mt-1 border border-dashed border-[#041E3F]/20 text-[#041E3F]/70 font-bold h-10 rounded-xl hover:bg-[#041E3F]/5"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Split Shift
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="catatan-jadwal" className="text-sm font-bold text-[#041E3F]">
          Catatan Khusus{" "}
          <span className="text-[#041E3F]/50 font-semibold">
            (Opsional)
          </span>
        </label>
        <Textarea
          id="catatan-jadwal"
          {...register("catatan")}
          placeholder="Contoh: Menggantikan shift Andi..."
          className="bg-[#FFFAF3] border-[#041E3F]/15 font-medium rounded-xl px-4 py-3 resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
        {targetJadwalId && (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
                void hapus(targetJadwalId);
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
            (!isEditMode && !penggunaTerpilih) ||
            (!isEditMode && !tanggalTerpilih) ||
            (status === "kerja" && !shiftIds[0])
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
  );
}

export function FormJadwalDialog({
  open,
  onOpenChange,
  penggunaId,
  namaKaryawan,
  tanggal,
  existingShifts = [],
  shiftList,
  karyawanList = [],
  onSimpan,
  onHapus,
  isPending = false,
}: FormJadwalDialogProps) {
  const isEditMode =
    existingShifts.length > 0 && existingShifts[0].id !== "off";

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
            aria-label="Tutup"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center p-2 rounded-md text-[#041E3F] hover:bg-[#041E3F]/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </div>

        <IsiFormJadwal
          penggunaId={penggunaId}
          tanggal={tanggal}
          existingShifts={existingShifts}
          shiftList={shiftList}
          karyawanList={karyawanList}
          isEditMode={isEditMode}
          onSimpan={onSimpan}
          onHapus={onHapus}
          onSelesai={() => onOpenChange(false)}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
