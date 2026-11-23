"use client";

import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Boxes, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAngka } from "@/lib/format";
import { BATAS_KEMASAN, type BahanBakuForm } from "./schema";

/**
 * Bagian "Kemasan" form buat dan ubah bahan baku (pemilik proyek,
 * 23 November 2026; backend P87, B359): baris Nama kemasan + Isi dalam
 * satuan dasar, paling banyak 10, dengan teks bantu "1 kaleng = 290 ml".
 * Stok dan riwayat tetap dalam satuan dasar; kemasan hanya cara memasukkan
 * dan membaca jumlah.
 */
export function IsianKemasan({
  control,
  register,
  errors,
  satuanDasar,
  nonaktif = false,
}: {
  control: Control<BahanBakuForm>;
  register: UseFormRegister<BahanBakuForm>;
  errors: FieldErrors<BahanBakuForm>;
  satuanDasar: string;
  nonaktif?: boolean;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "konversi" });
  const nilai = useWatch({ control, name: "konversi" }) ?? [];
  const galatDaftar = errors.konversi?.root?.message ?? errors.konversi?.message;

  return (
    <section aria-labelledby="judul-kemasan" className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-navy/10 pb-4">
        <Boxes className="h-5 w-5 text-karamel" aria-hidden="true" />
        <h3 id="judul-kemasan" className="text-besar font-bold text-navy">
          Kemasan <span className="text-isi font-medium text-navy/60">(opsional)</span>
        </h3>
      </div>
      <p className="text-kecil font-medium text-navy/70">
        Isi setiap kemasan ditulis dalam satuan dasar <b className="font-bold text-navy">{satuanDasar}</b>. Stok tetap
        dicatat dalam {satuanDasar}; kemasan dipakai untuk mencatat belanja, resep, pengajuan, surat jalan, dan hitung
        opname, misalnya 2 kaleng.
      </p>

      {fields.length > 0 && (
        <ul className="flex flex-col gap-3">
          {fields.map((field, i) => {
            const baris = nilai[i];
            const nama = baris?.satuan?.trim().toLowerCase();
            const isi = baris?.isi;
            const bantu = nama && typeof isi === "number" && isi > 0 ? `1 ${nama} = ${formatAngka(isi)} ${satuanDasar}` : null;
            const galat = errors.konversi?.[i];
            return (
              <li key={field.id} className="rounded-xl border border-navy/10 bg-gading p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-start">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label htmlFor={`kemasan-nama-${i}`} className="text-kecil font-bold text-navy">
                      Nama kemasan
                    </label>
                    <Input
                      id={`kemasan-nama-${i}`}
                      {...register(`konversi.${i}.satuan`)}
                      placeholder="Contoh: kaleng"
                      maxLength={20}
                      disabled={nonaktif}
                      aria-invalid={Boolean(galat?.satuan)}
                      className="bg-permukaan border-navy/20 text-navy"
                    />
                    {galat?.satuan && <span className="text-kecil font-bold text-rose-500">{galat.satuan.message}</span>}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label htmlFor={`kemasan-isi-${i}`} className="text-kecil font-bold text-navy">
                      Isi ({satuanDasar})
                    </label>
                    <Input
                      id={`kemasan-isi-${i}`}
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={0}
                      {...register(`konversi.${i}.isi`, { valueAsNumber: true })}
                      placeholder="290"
                      disabled={nonaktif}
                      aria-invalid={Boolean(galat?.isi)}
                      className="bg-permukaan border-navy/20 text-navy font-mono"
                    />
                    {galat?.isi && <span className="text-kecil font-bold text-rose-500">{galat.isi.message}</span>}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => remove(i)}
                    disabled={nonaktif}
                    aria-label={`Hapus kemasan ${nama || i + 1}`}
                    className="h-[42px] w-full cursor-pointer text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 sm:mt-[26px] sm:w-[42px]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sm:hidden">Hapus kemasan</span>
                  </Button>
                </div>
                {bantu && <p className="mt-2 text-kecil font-semibold text-sage-tua">{bantu}</p>}
              </li>
            );
          })}
        </ul>
      )}

      {galatDaftar && <p className="text-kecil font-bold text-rose-500">{galatDaftar}</p>}

      <Button
        type="button"
        variant="outline"
        size="aksi"
        onClick={() => append({ satuan: "", isi: Number.NaN })}
        disabled={nonaktif || fields.length >= BATAS_KEMASAN}
        className="w-full cursor-pointer border-dashed border-navy/30 bg-transparent text-navy hover:bg-navy/5 sm:w-fit"
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> Tambah Kemasan
      </Button>
    </section>
  );
}
