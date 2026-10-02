"use client";

import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { pesanError } from "@/lib/api/error";
import type { Diskon } from "@/types/diskon";
import { useBuatDiskon, usePerbaruiDiskon } from "./hooks";
import {
  NILAI_AWAL_DISKON,
  nilaiAwalDiskon,
  payloadBuatDiskon,
  payloadPerbaruiDiskon,
} from "./payload";
import { IsianAturanDiskon } from "./aturan-diskon";
import { skemaDiskon, type NilaiFormDiskon } from "./schema";

const KELAS_LABEL = "text-sm font-bold text-[#041E3F]";
const KELAS_PEMICU =
  "w-full bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4";
const KELAS_ISI_PILIHAN = "bg-[#F2EAE1] border-[#041E3F]/10 text-[#041E3F] font-medium";

function PesanIsian({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <p className="text-xs font-medium text-red-600">{pesan}</p>;
}

interface IsiProps {
  /** null berarti menambah diskon baru. */
  diskon: Diskon | null;
  /** Batas diskon aktif tercapai: diskon Non-Aktif tidak dapat diaktifkan. */
  batasTercapai: boolean;
  onTutup: () => void;
}

/**
 * Isi form diskon: enam field dasar dan bagian Aturan tambahan
 * (IsianAturanDiskon, keputusan PD3a), dipakai tambah dan ubah. Dipasang
 * setiap kali dialog dibuka, dengan nilai awal lewat defaultValues
 * (keputusan rancangan butir 8). Ubah hanya mengirim field yang berubah
 * (butir 15). Dialog hanya tertutup saat simpan berhasil; saat gagal, pesan
 * backend tampil di dalam form.
 */
function IsiFormDiskon({ diskon, batasTercapai, onTutup }: IsiProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiFormDiskon>({
    resolver: zodResolver(skemaDiskon),
    defaultValues: diskon ? nilaiAwalDiskon(diskon) : NILAI_AWAL_DISKON,
  });
  const tipe = useWatch({ control, name: "tipe" });
  const [galat, setGalat] = useState("");
  const aktifTerkunci = batasTercapai && diskon?.status !== "Aktif";

  const opsi = {
    onSuccess: () => {
      toast.success("Berhasil", {
        description: diskon ? "Diskon berhasil diperbarui." : "Diskon berhasil ditambahkan.",
      });
      onTutup();
    },
    onError: (err: Error) => {
      setGalat(pesanError(err, "Gagal menyimpan data diskon."));
    },
  };
  const buat = useBuatDiskon(opsi);
  const perbarui = usePerbaruiDiskon(opsi);
  const memproses = buat.isPending || perbarui.isPending;

  const kirim = (nilai: NilaiFormDiskon) => {
    setGalat("");
    if (!diskon) {
      buat.mutate(payloadBuatDiskon(nilai));
      return;
    }
    const payload = payloadPerbaruiDiskon(nilai, diskon);
    if (Object.keys(payload).length === 0) {
      toast.info("Tidak ada perubahan untuk disimpan");
      return;
    }
    perbarui.mutate({ id: diskon.id, payload });
  };

  return (
    <form onSubmit={handleSubmit(kirim)} noValidate className="flex flex-col gap-5">
      <div className="space-y-2">
        <label htmlFor="diskon-nama" className={KELAS_LABEL}>Nama Diskon</label>
        <Input
          id="diskon-nama"
          {...register("namaDiskon")}
          placeholder="Contoh: Diskon Kemerdekaan"
          className="bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-medium h-12 rounded-xl px-4"
        />
        <PesanIsian pesan={errors.namaDiskon?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="diskon-cakupan" className={KELAS_LABEL}>Cakupan</label>
          <Controller
            control={control}
            name="cakupan"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="diskon-cakupan" className={KELAS_PEMICU}>
                  <SelectValue placeholder="Pilih Cakupan" />
                </SelectTrigger>
                <SelectContent className={KELAS_ISI_PILIHAN}>
                  <SelectItem value="Global" className="cursor-pointer">Global</SelectItem>
                  <SelectItem value="Item" className="cursor-pointer">Item</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="diskon-tipe" className={KELAS_LABEL}>Tipe Diskon</label>
          <Controller
            control={control}
            name="tipe"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="diskon-tipe" className={KELAS_PEMICU}>
                  <SelectValue placeholder="Pilih Tipe" />
                </SelectTrigger>
                <SelectContent className={KELAS_ISI_PILIHAN}>
                  <SelectItem value="persen" className="cursor-pointer">Persen (%)</SelectItem>
                  <SelectItem value="nominal" className="cursor-pointer">Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="diskon-nilai" className={KELAS_LABEL}>Nilai Potongan</label>
        <div className="relative">
          {tipe === "nominal" && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#041E3F]/50 font-bold">Rp</span>
          )}
          <Input
            id="diskon-nilai"
            {...register("nilai")}
            inputMode="decimal"
            className={`no-spinner bg-[#FFFAF3] text-[#041E3F] text-sm border-[#041E3F]/15 focus-visible:ring-[#041E3F]/50 font-bold h-12 rounded-xl ${tipe === "nominal" ? "pl-11" : "px-4"}`}
            placeholder="0"
          />
          {tipe === "persen" && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#041E3F]/50 font-bold">%</span>
          )}
        </div>
        <PesanIsian pesan={errors.nilai?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="diskon-status" className={KELAS_LABEL}>Status</label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="diskon-status" className={KELAS_PEMICU}>
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent className={KELAS_ISI_PILIHAN}>
                  <SelectItem value="Aktif" disabled={aktifTerkunci} className="cursor-pointer">Aktif</SelectItem>
                  <SelectItem value="Non-Aktif" className="cursor-pointer text-red-600">Non-Aktif</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {aktifTerkunci && (
            <p className="text-xs font-medium text-[#041E3F]/60">
              Batas diskon aktif tercapai; diskon ini belum dapat diaktifkan.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="diskon-digabung" className={KELAS_LABEL}>Bisa Digabung?</label>
          <Controller
            control={control}
            name="bisaDigabung"
            render={({ field }) => (
              <Select
                value={field.value ? "true" : "false"}
                onValueChange={(nilai) => field.onChange(nilai === "true")}
              >
                <SelectTrigger id="diskon-digabung" className={KELAS_PEMICU}>
                  <SelectValue placeholder="Pilih Opsi" />
                </SelectTrigger>
                <SelectContent className={KELAS_ISI_PILIHAN}>
                  <SelectItem value="false" className="cursor-pointer">Tidak</SelectItem>
                  <SelectItem value="true" className="cursor-pointer">Ya</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <IsianAturanDiskon register={register} control={control} errors={errors} diskon={diskon} />

      {galat && (
        <p className="text-sm text-red-600 font-bold bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 mt-1">
          {galat}
        </p>
      )}

      <Button
        type="submit"
        disabled={memproses}
        className="w-full h-14 mt-2 rounded-xl cursor-pointer bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 text-base font-bold shadow-md transition-all active:scale-[0.98]"
      >
        {memproses ? "Menyimpan Data..." : "Simpan Konfigurasi"}
      </Button>
    </form>
  );
}

export function DialogFormDiskon({
  terbuka,
  diskon,
  batasTercapai,
  onTutup,
}: IsiProps & { terbuka: boolean }) {
  return (
    <Dialog
      open={terbuka}
      onOpenChange={(buka) => {
        if (!buka) onTutup();
      }}
    >
      <DialogContent className="sm:max-w-135 max-h-[90vh] overflow-y-auto border-[#041E3F]/10 bg-[#F2EAE1] p-6 sm:p-8 [&>button]:hidden rounded-[1.5rem] shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#041E3F]/15 bg-[#FFFAF3] text-[#041E3F]">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-[#041E3F]">
                {diskon ? "Edit Diskon" : "Tambah Diskon"}
              </DialogTitle>
              <DialogDescription className="text-sm font-semibold text-[#041E3F]/60 mt-0.5">
                {diskon
                  ? "Perbarui konfigurasi diskon."
                  : "Buat konfigurasi diskon atau promosi baru."}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onTutup}
            className="flex items-center justify-center p-2 rounded-md text-[#041E3F] hover:bg-[#041E3F]/10 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6 stroke-[2.5px]" />
          </button>
        </div>

        {terbuka && (
          <IsiFormDiskon
            key={diskon?.id ?? "baru"}
            diskon={diskon}
            batasTercapai={batasTercapai}
            onTutup={onTutup}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}