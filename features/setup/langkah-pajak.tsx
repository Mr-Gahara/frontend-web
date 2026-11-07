"use client";

import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skemaPajak, type NilaiPajak } from "@/features/pajak/schema";
import { LABEL_MODEL } from "@/features/pajak/tampilan";
import type { ModelPerhitungan } from "@/types/pajak";
import {
  DaftarTambahan,
  JudulLangkah,
  NavigasiLangkah,
  PenandaBelumTersimpan,
  PesanGalat,
  PesanIsian,
  PilihanTombol,
} from "./bagian";
import { useKirim } from "./kirim";
import { KELAS_ISIAN, KELAS_LABEL, KELAS_TOMBOL_GARIS, KELAS_TOMBOL_TAMBAH_AKTIF } from "./gaya";
import { adaIsian, gulirKe, pesanBelumTersimpan } from "./penanda";
import type { ButirDaftar, PropsLangkah } from "./langkah";

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

/**
 * Tanpa pajak tersimpan, simpan sekaligus melanjutkan. Bila sudah ada
 * pajak (wizard dibuka ulang atau pajak kedua), daftarnya tampil dan form
 * menambah pajak tanpa berpindah langkah; onSelesai melanjutkan
 * (keputusan pemilik proyek, 5 November 2026).
 */
export function LangkahPajak({
  nomor,
  total,
  teksLanjut,
  awal,
  onLanjut,
  onKembali,
  tersimpan = [],
  adaAktif = false,
  onSelesai,
}: Omit<PropsLangkah<NilaiPajak>, "awal"> & {
  awal?: NilaiPajak | null;
  tersimpan?: ButirDaftar[];
  /** Setup selesai bila minimal satu pajak aktif. */
  adaAktif?: boolean;
  onSelesai?: () => void;
}) {
  const modeDaftar = tersimpan.length > 0;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NilaiPajak>({
    resolver: zodResolver(skemaPajak),
    defaultValues: awal ?? NILAI_AWAL_PAJAK,
  });
  const { kirim, sibuk, galat, setGalat } = useKirim(async (n: NilaiPajak) => {
    await onLanjut(n);
    if (modeDaftar) reset(NILAI_AWAL_PAJAK);
  }, "Gagal menyimpan pajak.");
  const tipePajak = useWatch({ control, name: "tipePajak" });
  const model = useWatch({ control, name: "modelPerhitungan" });
  const namaPajak = useWatch({ control, name: "namaPajak" });
  const tarifPajak = useWatch({ control, name: "tarifPajak" });
  // Pajak pertama dikirim langsung oleh tombol lanjut; penanda hanya untuk
  // pajak berikutnya yang memakai Tambah pajak.
  const tertinggal = modeDaftar && adaIsian([namaPajak, tarifPajak]);
  const tambahRef = useRef<HTMLButtonElement>(null);

  return (
    <form
      onSubmit={handleSubmit(kirim)}
      noValidate
      className="flex flex-col gap-[22px]"
    >
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Pajak"
        keterangan="Minimal satu pajak aktif. Pajak dihitung otomatis di setiap transaksi kasir."
      />
      <DaftarTambahan judul="Pajak tersimpan" butir={tersimpan} />
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
          {
            nilai: "transaksi",
            label: "Seluruh transaksi",
            keterangan: "Dihitung dari total belanja",
          },
          {
            nilai: "produk",
            label: "Produk tertentu",
            keterangan: "Produknya dipilih di halaman Pajak",
          },
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
        Hanya satu pajak seluruh transaksi yang bisa aktif. Pajak lain bisa
        ditambahkan nanti dari Pengaturan.
      </p>
      {modeDaftar && (
        <>
          <button
            ref={tambahRef}
            type="submit"
            disabled={sibuk}
            className={(tertinggal ? KELAS_TOMBOL_TAMBAH_AKTIF : KELAS_TOMBOL_GARIS) + " self-start"}
          >
            {sibuk ? "Menyimpan..." : "Tambah pajak"}
          </button>
          {tertinggal && <PenandaBelumTersimpan teksTombol="Tambah pajak" />}
        </>
      )}
      <PesanGalat pesan={galat} />
      <NavigasiLangkah
        onKembali={onKembali}
        onLanjut={
          modeDaftar
            ? () => {
                if (tertinggal) {
                  setGalat(pesanBelumTersimpan("Pajak", namaPajak, "Tambah pajak"));
                  gulirKe(tambahRef.current);
                } else if (adaAktif) onSelesai?.();
                else setGalat("Minimal satu pajak aktif sebelum lanjut.");
              }
            : undefined
        }
        teksLanjut={teksLanjut}
        sibuk={sibuk}
      />
    </form>
  );
}
