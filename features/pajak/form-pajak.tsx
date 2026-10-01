"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Pajak } from "@/types/pajak";
import { payloadUbahPajak } from "./payload";
import { skemaPajak, type NilaiPajak } from "./schema";
import { pajakTransaksiTerdampak } from "./tampilan";

const kelasLabel = "text-sm font-bold text-[#0A2947]";
const kelasIsian = "bg-white border-[#0A2947]/20 text-[#0A2947]";
const kelasIsiPilihan = "bg-[#FFFAF3] border-[#0A2947]/10 text-[#0A2947]";
const kelasPilihan = "cursor-pointer hover:bg-[#0A2947]/5";
const kelasGalat = "text-xs font-bold text-red-600";

type PropsForm = {
  nilaiAwal: NilaiPajak;
  /** Data server saat mengubah; tanpa ini form dalam mode buat. */
  asal?: Pajak;
  /** Seluruh pajak tenant, untuk peringatan pajak per transaksi yang akan dinonaktifkan (PO7a). */
  daftar: readonly Pajak[];
  sedangMenyimpan: boolean;
  galat: string;
  onSimpan: (nilai: NilaiPajak) => void;
  onBatal: () => void;
};

/**
 * Isi dialog buat dan ubah pajak. Dipasang setiap kali dialog dibuka, dengan
 * nilai awal lewat defaultValues (keputusan rancangan butir 8). Validasi
 * oleh skemaPajak (PO8a), bukan validasi browser: halaman lama menahan
 * submit diam-diam selama prioritas belum diketik. Teks label dan susunan
 * isian sama dengan halaman lama; prioritas menjadi pilihan 1 atau 2.
 */
export function FormPajak({ nilaiAwal, asal, daftar, sedangMenyimpan, galat, onSimpan, onBatal }: PropsForm) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiPajak>({ resolver: zodResolver(skemaPajak), defaultValues: nilaiAwal });
  const nilai = useWatch({ control }) as NilaiPajak;
  const terdampak = pajakTransaksiTerdampak(daftar, nilai, asal?.id);
  const perubahan = asal ? payloadUbahPajak(nilai, asal) : null;
  const adaPerubahan = !asal || !perubahan || Object.keys(perubahan).length > 1 || perubahan.tipePajak !== asal.tipePajak;

  return (
    <form onSubmit={handleSubmit(onSimpan)} noValidate className="mt-4 flex flex-col gap-4">
      <div className="space-y-2">
        <label htmlFor="pajak-nama" className={kelasLabel}>
          Nama Pajak
        </label>
        <Input id="pajak-nama" className={kelasIsian} {...register("namaPajak")} />
        {errors.namaPajak && <p className={kelasGalat}>{errors.namaPajak.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="pajak-tarif" className={kelasLabel}>
            Tarif (%)
          </label>
          <Input
            id="pajak-tarif"
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            max={100}
            className={`no-spinner ${kelasIsian}`}
            {...register("tarifPajak")}
          />
          {errors.tarifPajak && <p className={kelasGalat}>{errors.tarifPajak.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="pajak-prioritas" className={kelasLabel}>
            Prioritas
          </label>
          <Controller
            control={control}
            name="prioritas"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="pajak-prioritas" className={`w-full ${kelasIsian}`}>
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent className={kelasIsiPilihan}>
                  <SelectItem value="1" className={kelasPilihan}>
                    1
                  </SelectItem>
                  <SelectItem value="2" className={kelasPilihan}>
                    2
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.prioritas && <p className={kelasGalat}>{errors.prioritas.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="pajak-tipe" className={kelasLabel}>
          Tipe Pajak
        </label>
        <Controller
          control={control}
          name="tipePajak"
          render={({ field }) => (
            <Select value={field.value ? "true" : "false"} onValueChange={(v) => field.onChange(v === "true")}>
              <SelectTrigger id="pajak-tipe" className={kelasIsian}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={kelasIsiPilihan}>
                <SelectItem value="true" className={kelasPilihan}>
                  Per Produk
                </SelectItem>
                <SelectItem value="false" className={kelasPilihan}>
                  Per Transaksi
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="pajak-model" className={kelasLabel}>
          Model Perhitungan
        </label>
        <Controller
          control={control}
          name="modelPerhitungan"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="pajak-model" className={kelasIsian}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={kelasIsiPilihan}>
                <SelectItem value="1" className={kelasPilihan}>
                  Inklusif
                </SelectItem>
                <SelectItem value="2" className={kelasPilihan}>
                  Add-on
                </SelectItem>
                <SelectItem value="3" className={kelasPilihan}>
                  Compound
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="pajak-status" className={kelasLabel}>
          Status
        </label>
        <Controller
          control={control}
          name="statusPajak"
          render={({ field }) => (
            <Select value={field.value ? "true" : "false"} onValueChange={(v) => field.onChange(v === "true")}>
              <SelectTrigger id="pajak-status" className={kelasIsian}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={kelasIsiPilihan}>
                <SelectItem value="true" className={kelasPilihan}>
                  Aktif
                </SelectItem>
                <SelectItem value="false" className={kelasPilihan}>
                  Non-Aktif
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {terdampak.length > 0 && (
        <p className="rounded-lg border border-[#D4A373]/40 bg-[#D4A373]/10 p-3 text-sm font-medium text-[#0A2947]">
          Menyimpan pajak per transaksi yang aktif akan menonaktifkan {terdampak.map((p) => p.namaPajak).join(", ")}.
          Hanya satu pajak per transaksi yang aktif dalam satu waktu.
        </p>
      )}

      {galat && <p className="text-sm font-bold text-red-600">{galat}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBatal}
          disabled={sedangMenyimpan}
          className="cursor-pointer border-[#0A2947]/20 text-[#0A2947] hover:bg-[#0A2947]/5 font-bold"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={sedangMenyimpan || !adaPerubahan}
          className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 shadow-sm font-bold"
        >
          {sedangMenyimpan ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}