"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skemaPajak, type NilaiPajak } from "@/features/pajak/schema";
import { LABEL_MODEL } from "@/features/pajak/tampilan";
import type { ModelPerhitungan } from "@/types/pajak";
import { JudulLangkah, NavigasiLangkah, PesanIsian, PilihanTombol } from "./bagian";
import { KELAS_ISIAN, KELAS_LABEL } from "./gaya";
import type { PropsLangkah } from "./langkah";

/**
 * Langkah pajak, wajib di semua plan (modul/setup-akun.md, Kriteria setup).
 * Prioritas dan status tidak ditanyakan: setup hanya butuh satu pajak aktif,
 * jadi prioritas memakai "1" dan status aktif. Keduanya tetap bisa diubah di
 * halaman Pajak.
 */
const NILAI_AWAL_PAJAK: NilaiPajak = {
  namaPajak: "",
  tarifPajak: "",
  tipePajak: false,
  modelPerhitungan: "2",
  prioritas: "1",
  statusPajak: true,
};

const KETERANGAN_MODEL: Record<NilaiPajak["modelPerhitungan"], string> = {
  "1": "Pajak sudah termasuk harga jual",
  "2": "Pajak ditambahkan ke harga jual",
  "3": "Dihitung di atas pajak lain",
};

export function LangkahPajak({
  nomor,
  total,
  teksLanjut,
  awal,
  onLanjut,
  onKembali,
}: PropsLangkah<NilaiPajak | null>) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<NilaiPajak>({ resolver: zodResolver(skemaPajak), defaultValues: awal ?? NILAI_AWAL_PAJAK });
  const tipePajak = useWatch({ control, name: "tipePajak" });
  const model = useWatch({ control, name: "modelPerhitungan" });

  return (
    <form onSubmit={handleSubmit(onLanjut)} noValidate className="flex flex-col gap-[22px]">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Pajak"
        keterangan="Minimal satu pajak aktif. Pajak dihitung otomatis di setiap transaksi kasir."
      />
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-[2_1_220px] flex-col gap-2">
          <label htmlFor="setup-pajak-nama" className={KELAS_LABEL}>
            Nama pajak
          </label>
          <input
            id="setup-pajak-nama"
            {...register("namaPajak")}
            aria-invalid={errors.namaPajak ? true : undefined}
            className={KELAS_ISIAN}
          />
          <PesanIsian pesan={errors.namaPajak?.message} />
        </div>
        <div className="flex flex-[1_1_120px] flex-col gap-2">
          <label htmlFor="setup-pajak-tarif" className={KELAS_LABEL}>
            Tarif (%)
          </label>
          <input
            id="setup-pajak-tarif"
            inputMode="decimal"
            {...register("tarifPajak")}
            aria-invalid={errors.tarifPajak ? true : undefined}
            className={KELAS_ISIAN}
          />
          <PesanIsian pesan={errors.tarifPajak?.message} />
        </div>
      </div>
      <PilihanTombol
        id="setup-pajak-tipe"
        pertanyaan="Berlaku untuk"
        opsi={[
          { nilai: "transaksi", label: "Seluruh transaksi", keterangan: "Dihitung dari total belanja" },
          { nilai: "produk", label: "Produk tertentu", keterangan: "Produknya dipilih di halaman Pajak" },
        ]}
        nilai={tipePajak ? "produk" : "transaksi"}
        onUbah={(n) => setValue("tipePajak", n === "produk")}
      />
      <PilihanTombol
        id="setup-pajak-model"
        pertanyaan="Cara hitung"
        opsi={(["1", "2", "3"] as const).map((m) => ({
          nilai: m,
          label: LABEL_MODEL[Number(m) as ModelPerhitungan],
          keterangan: KETERANGAN_MODEL[m],
        }))}
        nilai={model}
        onUbah={(n) => setValue("modelPerhitungan", n)}
      />
      <p className="text-sm leading-normal text-muted-foreground">
        Hanya satu pajak seluruh transaksi yang bisa aktif. Pajak lain bisa ditambahkan nanti dari Pengaturan.
      </p>
      <NavigasiLangkah onKembali={onKembali} teksLanjut={teksLanjut} />
    </form>
  );
}