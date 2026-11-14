"use client";

import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { hanyaAngka } from "@/features/pengguna/schema-profil";
import { JudulLangkah, KotakInfo, NavigasiLangkah, PesanGalat, PesanIsian } from "./bagian";
import { useKirim } from "./kirim";
import { KELAS_BANTU, KELAS_ISIAN, KELAS_LABEL } from "./gaya";
import type { PropsLangkah } from "./langkah";
import { titikNamaToko, titikOwner } from "./titik-panduan";
import { skemaNamaToko, skemaOwner, type NilaiNamaToko, type NilaiOwner } from "./schema";

export function LangkahNamaToko({ nomor, total, teksLanjut, awal, onLanjut }: PropsLangkah<NilaiNamaToko>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiNamaToko>({ resolver: zodResolver(skemaNamaToko), defaultValues: awal });
  const { kirim, sibuk, galat } = useKirim(onLanjut, "Gagal menyimpan nama toko.");

  return (
    <form onSubmit={handleSubmit(kirim)} noValidate className="flex flex-col gap-6">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Nama toko"
        keterangan="Nama ini tampil di kasir, struk, dan laporan. Bisa diubah nanti di Profil Toko."
        panduan={{ kunci: "toko", titik: titikNamaToko(teksLanjut) }}
      />
      <div data-panduan="nama-toko" className="flex flex-col gap-2">
        <label htmlFor="setup-nama-toko" className={KELAS_LABEL}>
          Nama toko
        </label>
        <input
          id="setup-nama-toko"
          {...register("namaToko")}
          aria-describedby="setup-nama-toko-bantu"
          aria-invalid={errors.namaToko ? true : undefined}
          className={KELAS_ISIAN}
        />
        <p id="setup-nama-toko-bantu" className={KELAS_BANTU}>
          Minimal 3 karakter.
        </p>
        <PesanIsian pesan={errors.namaToko?.message} />
      </div>
      <PesanGalat pesan={galat} />
      <NavigasiLangkah teksLanjut={teksLanjut} sibuk={sibuk} />
    </form>
  );
}

export function LangkahOwner({ nomor, total, teksLanjut, awal, onLanjut, onKembali }: PropsLangkah<NilaiOwner>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NilaiOwner>({ resolver: zodResolver(skemaOwner), defaultValues: awal });
  const { kirim, sibuk, galat } = useKirim(onLanjut, "Gagal mendaftarkan Owner.");
  const isianPin = register("pin");
  const isianUlang = register("ulangiPin");
  const angkaSaja = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.value = hanyaAngka(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit(kirim)} noValidate className="flex flex-col gap-6">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Owner toko"
        keterangan="Owner memegang semua izin dan menambahkan karyawan lain nanti. Ia masuk dengan nama dan PIN, di web maupun di aplikasi kasir."
        panduan={{ kunci: "owner", titik: titikOwner(teksLanjut) }}
      />
      <div data-panduan="owner-nama" className="flex flex-col gap-2">
        <label htmlFor="setup-owner-nama" className={KELAS_LABEL}>
          Nama Owner
        </label>
        <input
          id="setup-owner-nama"
          {...register("nama")}
          aria-invalid={errors.nama ? true : undefined}
          className={KELAS_ISIAN}
        />
        <PesanIsian pesan={errors.nama?.message} />
      </div>
      <div data-panduan="owner-pin" className="flex flex-wrap gap-4">
        <div className="flex flex-[1_1_200px] flex-col gap-2">
          <label htmlFor="setup-owner-pin" className={KELAS_LABEL}>
            PIN
          </label>
          <input
            id="setup-owner-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            {...isianPin}
            onChange={(e) => {
              angkaSaja(e);
              return isianPin.onChange(e);
            }}
            aria-describedby="setup-owner-pin-bantu"
            aria-invalid={errors.pin ? true : undefined}
            className={KELAS_ISIAN + " text-subjudul tracking-[0.4em]"}
          />
          <p id="setup-owner-pin-bantu" className={KELAS_BANTU}>
            6 digit angka.
          </p>
          <PesanIsian pesan={errors.pin?.message} />
        </div>
        <div className="flex flex-[1_1_200px] flex-col gap-2">
          <label htmlFor="setup-owner-ulang" className={KELAS_LABEL}>
            Ulangi PIN
          </label>
          <input
            id="setup-owner-ulang"
            type="password"
            inputMode="numeric"
            maxLength={6}
            {...isianUlang}
            onChange={(e) => {
              angkaSaja(e);
              return isianUlang.onChange(e);
            }}
            aria-invalid={errors.ulangiPin ? true : undefined}
            className={KELAS_ISIAN + " text-subjudul tracking-[0.4em]"}
          />
          <PesanIsian pesan={errors.ulangiPin?.message} />
        </div>
      </div>
      <KotakInfo>
        Akses Owner selalu web dan aplikasi. Sesudah disimpan, Anda langsung masuk sebagai Owner untuk
        melanjutkan langkah berikutnya.
      </KotakInfo>
      <PesanGalat pesan={galat} />
      <NavigasiLangkah onKembali={onKembali} teksLanjut={teksLanjut} sibuk={sibuk} />
    </form>
  );
}