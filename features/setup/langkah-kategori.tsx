"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skemaKategori } from "@/features/kategori/schema";
import { DaftarTambahan, JudulLangkah, NavigasiLangkah, PesanGalat, PesanIsian } from "./bagian";
import { KELAS_ISIAN, KELAS_LABEL, KELAS_TOMBOL_GARIS } from "./gaya";
import { useKirim } from "./kirim";
import type { PropsDaftar } from "./langkah";

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
    formState: { errors },
  } = useForm<NilaiKategori>({ resolver: zodResolver(skemaKategori), defaultValues: NILAI_AWAL_KATEGORI });

  const { kirim, sibuk, galat, setGalat } = useKirim(async (n: NilaiKategori) => {
    await onTambah(n);
    reset(NILAI_AWAL_KATEGORI);
  }, "Gagal menyimpan kategori.");
  const hapus = useKirim(onHapus, "Gagal menghapus kategori.");

  return (
    <div className="flex flex-col gap-6">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Kategori produk"
        keterangan="Kategori mengelompokkan menu di layar kasir. Tambahkan minimal satu."
      />
      <form onSubmit={handleSubmit(kirim)} noValidate className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
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
        <button type="submit" disabled={sibuk} className={KELAS_TOMBOL_GARIS + " self-start"}>
          {sibuk ? "Menyimpan..." : "Tambah kategori"}
        </button>
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
        onLanjut={() => (butir.length === 0 ? setGalat("Tambahkan minimal satu kategori.") : onLanjut())}
      />
    </div>
  );
}
