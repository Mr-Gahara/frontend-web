"use client";

import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skemaKategori } from "@/features/kategori/schema";
import { DaftarTambahan, JudulLangkah, NavigasiLangkah, PenandaBelumTersimpan, PesanGalat, PesanIsian } from "./bagian";
import { KELAS_ISIAN, KELAS_LABEL, KELAS_TOMBOL_GARIS, KELAS_TOMBOL_TAMBAH_AKTIF } from "./gaya";
import { adaIsian, gulirKe, pesanBelumTersimpan } from "./penanda";
import { useKirim } from "./kirim";
import type { PropsDaftar } from "./langkah";
import { titikKategori } from "./titik-panduan";

type NilaiKategori = { namaKategori: string; kodeKategori: string; keterangan: string };

const NILAI_AWAL_KATEGORI: NilaiKategori = { namaKategori: "", kodeKategori: "", keterangan: "" };

export type { NilaiKategori };

/** Kategori produk; setiap kategori langsung tersimpan di server. */
export function LangkahKategori({
  nomor,
  total,
  teksLanjut,
  butir,
  onTambah,
  onHapus,
  onLanjut,
  onKembali,
}: PropsDaftar<NilaiKategori>) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<NilaiKategori>({ resolver: zodResolver(skemaKategori), defaultValues: NILAI_AWAL_KATEGORI });

  const { kirim, sibuk, galat, setGalat } = useKirim(async (n: NilaiKategori) => {
    await onTambah(n);
    reset(NILAI_AWAL_KATEGORI);
  }, "Gagal menyimpan kategori.");
  const hapus = useKirim(onHapus, "Gagal menghapus kategori.");
  const isian = useWatch({ control });
  const tertinggal = adaIsian([isian.namaKategori, isian.kodeKategori]);
  const tambahRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Kategori produk"
        keterangan="Kategori mengelompokkan menu di layar kasir. Tambahkan minimal satu."
        panduan={{ kunci: "kategori", titik: titikKategori(teksLanjut) }}
      />
      <form onSubmit={handleSubmit(kirim)} noValidate className="flex flex-col gap-3">
        <div data-panduan="kategori-isian" className="flex flex-wrap gap-3">
          <div className="flex flex-[2_1_220px] flex-col gap-2">
            <label htmlFor="setup-kategori-nama" className={KELAS_LABEL}>
              Nama kategori
            </label>
            <input
              id="setup-kategori-nama"
              placeholder="Contoh: Minuman dingin"
              {...register("namaKategori")}
              aria-invalid={errors.namaKategori ? true : undefined}
              className={KELAS_ISIAN}
            />
            <PesanIsian pesan={errors.namaKategori?.message} />
          </div>
          <div className="flex flex-[1_1_140px] flex-col gap-2">
            <label htmlFor="setup-kategori-kode" className={KELAS_LABEL}>
              Kode kategori
            </label>
            <input
              id="setup-kategori-kode"
              placeholder="Contoh: MND"
              {...register("kodeKategori")}
              aria-invalid={errors.kodeKategori ? true : undefined}
              className={KELAS_ISIAN}
            />
            <PesanIsian pesan={errors.kodeKategori?.message} />
          </div>
        </div>
        <button
          ref={tambahRef}
          type="submit"
          data-panduan="tambah"
          disabled={sibuk}
          className={(tertinggal ? KELAS_TOMBOL_TAMBAH_AKTIF : KELAS_TOMBOL_GARIS) + " self-start"}
        >
          {sibuk ? "Menyimpan..." : "Tambah kategori"}
        </button>
        {tertinggal && <PenandaBelumTersimpan teksTombol="Tambah kategori" />}
      </form>
      <DaftarTambahan
        judul="Kategori ditambahkan"
        butir={butir}
        onHapus={(id) => void hapus.kirim(id)}
      />
      <PesanGalat pesan={galat || hapus.galat} />
      <NavigasiLangkah
        onKembali={onKembali}
        teksLanjut={teksLanjut}
        sibuk={sibuk || hapus.sibuk}
        onLanjut={() => {
          if (tertinggal) {
            setGalat(pesanBelumTersimpan("Kategori", isian.namaKategori, "Tambah kategori"));
            gulirKe(tambahRef.current);
          } else if (butir.length === 0) setGalat("Tambahkan minimal satu kategori.");
          else onLanjut();
        }}
      />
    </div>
  );
}
