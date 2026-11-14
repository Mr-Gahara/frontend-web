"use client";

import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SATUAN_BAHAN_OPTIONS } from "@/types/bahanBaku";
import {
  DaftarTambahan,
  JudulLangkah,
  NavigasiLangkah,
  PenandaBelumTersimpan,
  PesanGalat,
  PesanIsian,
  PilihanTombol,
} from "./bagian";
import { KELAS_ISIAN, KELAS_LABEL, KELAS_TOMBOL_GARIS, KELAS_TOMBOL_TAMBAH_AKTIF } from "./gaya";
import { adaIsian, gulirKe, pesanBelumTersimpan } from "./penanda";
import { useKirim } from "./kirim";
import type { PropsDaftar } from "./langkah";
import { skemaBahanSetup, type NilaiBahanSetup } from "./schema";
import { titikBahan } from "./titik-panduan";

const NILAI_AWAL_BAHAN: NilaiBahanSetup = { namaBahan: "", satuan: SATUAN_BAHAN_OPTIONS[0], stok: "", stokMinimum: "" };

/**
 * Bahan baku, hanya bila ada menu beresep (SA11a). Setiap bahan langsung
 * tersimpan di server; pilihan ada resep diteruskan ke langkah produk.
 */
export function LangkahBahanBaku({
  nomor,
  total,
  teksLanjut,
  butir,
  onTambah,
  onHapus,
  onLanjut,
  onKembali,
  adaResepAwal,
}: Omit<PropsDaftar<NilaiBahanSetup>, "onLanjut"> & {
  adaResepAwal: boolean;
  onLanjut: (adaResep: boolean) => void;
}) {
  const [adaResep, setAdaResep] = useState(adaResepAwal);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<NilaiBahanSetup>({ resolver: zodResolver(skemaBahanSetup), defaultValues: NILAI_AWAL_BAHAN });

  const { kirim, sibuk, galat, setGalat } = useKirim(async (n: NilaiBahanSetup) => {
    await onTambah(n);
    reset(NILAI_AWAL_BAHAN);
  }, "Gagal menyimpan bahan baku.");
  const hapus = useKirim(onHapus, "Gagal menghapus bahan baku.");
  const isian = useWatch({ control });
  const tertinggal = adaResep && adaIsian([isian.namaBahan, isian.stok, isian.stokMinimum]);
  const tambahRef = useRef<HTMLButtonElement>(null);

  const lanjut = () => {
    if (tertinggal) {
      setGalat(pesanBelumTersimpan("Bahan baku", isian.namaBahan, "Tambah bahan baku"));
      gulirKe(tambahRef.current);
      return;
    }
    if (adaResep && butir.length === 0) {
      setGalat("Tambahkan minimal satu bahan baku, atau pilih tidak ada resep.");
      return;
    }
    onLanjut(adaResep);
  };

  return (
    <div className="flex flex-col gap-6">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Bahan baku"
        keterangan="Bahan baku dipakai menu yang dibuat dari resep, misalnya biji kopi dan susu. Stoknya berkurang setiap menu itu terjual."
        panduan={{ kunci: "bahanBaku", titik: titikBahan(teksLanjut, adaResep) }}
      />
      <PilihanTombol
        id="setup-bahan-tanya"
        panduan="bahan-resep"
        pertanyaan="Ada menu yang dibuat dari resep?"
        opsi={[
          { nilai: "ya", label: "Ya, ada yang pakai resep" },
          { nilai: "tidak", label: "Tidak, lewati langkah ini" },
        ]}
        nilai={adaResep ? "ya" : "tidak"}
        onUbah={(n) => {
          setAdaResep(n === "ya");
          setGalat("");
        }}
      />
      {adaResep ? (
        <>
          <form onSubmit={handleSubmit(kirim)} noValidate className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-[2_1_220px] flex-col gap-2">
                <label htmlFor="setup-bahan-nama" className={KELAS_LABEL}>
                  Nama bahan
                </label>
                <input
                  id="setup-bahan-nama"
                  {...register("namaBahan")}
                  aria-invalid={errors.namaBahan ? true : undefined}
                  className={KELAS_ISIAN}
                />
                <PesanIsian pesan={errors.namaBahan?.message} />
              </div>
              <div className="flex flex-[1_1_120px] flex-col gap-2">
                <label htmlFor="setup-bahan-satuan" className={KELAS_LABEL}>
                  Satuan
                </label>
                <select id="setup-bahan-satuan" {...register("satuan")} className={KELAS_ISIAN}>
                  {SATUAN_BAHAN_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <PesanIsian pesan={errors.satuan?.message} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-[1_1_160px] flex-col gap-2">
                <label htmlFor="setup-bahan-stok" className={KELAS_LABEL}>
                  Stok awal
                </label>
                <input
                  id="setup-bahan-stok"
                  inputMode="decimal"
                  {...register("stok")}
                  aria-invalid={errors.stok ? true : undefined}
                  className={KELAS_ISIAN}
                />
                <PesanIsian pesan={errors.stok?.message} />
              </div>
              <div className="flex flex-[1_1_160px] flex-col gap-2">
                <label htmlFor="setup-bahan-minimum" className={KELAS_LABEL}>
                  Batas stok minimum
                </label>
                <input
                  id="setup-bahan-minimum"
                  inputMode="decimal"
                  {...register("stokMinimum")}
                  aria-invalid={errors.stokMinimum ? true : undefined}
                  className={KELAS_ISIAN}
                />
                <PesanIsian pesan={errors.stokMinimum?.message} />
              </div>
            </div>
            <button
              ref={tambahRef}
              type="submit"
              data-panduan="tambah"
              disabled={sibuk}
              className={(tertinggal ? KELAS_TOMBOL_TAMBAH_AKTIF : KELAS_TOMBOL_GARIS) + " self-start"}
            >
              {sibuk ? "Menyimpan..." : "Tambah bahan baku"}
            </button>
            {tertinggal && <PenandaBelumTersimpan teksTombol="Tambah bahan baku" />}
          </form>
          <DaftarTambahan
            judul="Bahan baku ditambahkan"
            butir={butir}
            onHapus={(id) => void hapus.kirim(id)}
          />
        </>
      ) : (
        <p role="status" className="rounded-xl border border-input bg-gading px-4 py-3.5 text-isi leading-normal">
          Langkah ini dilewati. Di langkah produk, pertanyaan resep tidak ditampilkan. Bahan baku tetap bisa
          ditambahkan nanti dari menu Inventaris.
        </p>
      )}
      <PesanGalat pesan={galat || hapus.galat} />
      <NavigasiLangkah onKembali={onKembali} teksLanjut={teksLanjut} onLanjut={lanjut} sibuk={sibuk || hapus.sibuk} />
    </div>
  );
}
