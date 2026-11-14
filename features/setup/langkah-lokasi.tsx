"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { skemaLokasi, type NilaiFormLokasi } from "@/features/inventaris/schema-lokasi";
import { JudulLangkah, KotakPeringatan, NavigasiLangkah, PesanGalat, PesanIsian } from "./bagian";
import { useKirim } from "./kirim";
import { KELAS_AREA, KELAS_BANTU, KELAS_ISIAN, KELAS_LABEL, KELAS_TOMBOL_GARIS } from "./gaya";
import type { PropsLangkah } from "./langkah";
import { titikLokasi } from "./titik-panduan";

const TEKS = {
  outlet: {
    judul: "Lokasi outlet",
    keterangan: "Tempat kasir berjualan. Stok, shift, dan penjualan dicatat per lokasi.",
    labelNama: "Nama outlet",
    tempat: "outlet",
    penghuni: "karyawan",
    catatanLangkah: undefined,
    catatanAkhir: "Setup memakai tepat satu outlet. Outlet lain dan gudang ditambahkan dari Pengaturan sesuai plan.",
  },
  gudang: {
    judul: "Gudang",
    keterangan:
      "Gudang menyimpan stok cadangan dan mengirimkannya ke outlet lewat pengajuan dan transfer stok. Kasir tetap bisa dipakai selama langkah ini belum selesai.",
    labelNama: "Nama gudang",
    tempat: "gudang",
    penghuni: "staf gudang",
    catatanLangkah: "fitur plan Pro",
    catatanAkhir: undefined,
  },
} as const;

type StatusDeteksi = "diam" | "mencari" | "berhasil" | "gagal";

/**
 * Langkah lokasi outlet dan gudang. Skema dan cara deteksi sama dengan
 * isian-lokasi.tsx. Koordinat dijaga dua peringatan: catatan tetap di atas
 * tombol ambil koordinat, lalu dialog konfirmasi saat disimpan; langkah baru
 * maju setelah pengguna menyatakan sedang berada di lokasi itu.
 */
export function LangkahLokasi({
  jenis,
  nomor,
  total,
  teksLanjut,
  awal,
  onLanjut,
  onKembali,
  onLewati,
}: PropsLangkah<NilaiFormLokasi> & { jenis: "outlet" | "gudang" }) {
  const teks = TEKS[jenis];
  const { kirim, sibuk, galat } = useKirim(onLanjut, `Gagal menyimpan ${teks.tempat}.`);
  const [deteksi, setDeteksi] = useState<StatusDeteksi>("diam");
  const [konfirmasi, setKonfirmasi] = useState<NilaiFormLokasi | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NilaiFormLokasi>({ resolver: zodResolver(skemaLokasi), defaultValues: awal });
  const id = (nama: string) => `setup-${jenis}-${nama}`;

  const ambilKoordinat = () => {
    if (!("geolocation" in navigator)) {
      setDeteksi("gagal");
      return;
    }
    setDeteksi("mencari");
    navigator.geolocation.getCurrentPosition(
      (posisi) => {
        const opsi = { shouldValidate: true, shouldDirty: true };
        setValue("latitude", posisi.coords.latitude.toString(), opsi);
        setValue("longitude", posisi.coords.longitude.toString(), opsi);
        setDeteksi("berhasil");
      },
      () => setDeteksi("gagal"),
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit(setKonfirmasi)} noValidate className="flex flex-col gap-6">
        <JudulLangkah
          nomor={nomor}
          total={total}
          judul={teks.judul}
          keterangan={teks.keterangan}
          catatan={teks.catatanLangkah}
          panduan={{
            kunci: jenis === "outlet" ? "lokasi" : "gudang",
            titik: titikLokasi(jenis, teksLanjut, Boolean(onLewati)),
          }}
        />
        <div data-panduan="lokasi-nama" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor={id("nama")} className={KELAS_LABEL}>
              {teks.labelNama}
            </label>
            <input
              id={id("nama")}
              {...register("nama")}
              aria-invalid={errors.nama ? true : undefined}
              className={KELAS_ISIAN}
            />
            <PesanIsian pesan={errors.nama?.message} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor={id("alamat")} className={KELAS_LABEL}>
              Alamat
            </label>
            <textarea
              id={id("alamat")}
              rows={3}
              {...register("alamat")}
              aria-invalid={errors.alamat ? true : undefined}
              className={KELAS_AREA}
            />
            <PesanIsian pesan={errors.alamat?.message} />
          </div>
        </div>

        <section
          aria-labelledby={id("koordinat")}
          className="flex flex-col gap-3.5 rounded-2xl border border-input p-[18px]"
        >
          <div className="flex flex-col gap-1">
            <h2 id={id("koordinat")} className="text-subjudul font-bold">
              Koordinat untuk absensi
            </h2>
            <p className="text-isi leading-normal text-muted-foreground">
              {teks.penghuni[0].toUpperCase() + teks.penghuni.slice(1)} hanya bisa absen bila berada di sekitar
              koordinat ini. Lokasi tanpa koordinat tidak bisa dipakai untuk absen.
            </p>
          </div>
          <KotakPeringatan>
            <strong>Ambil koordinat saat Anda berada di {teks.tempat} ini.</strong> Jangan mengambilnya dari
            rumah, kantor, atau tempat lain; koordinat yang salah membuat {teks.penghuni} tidak bisa absen.
          </KotakPeringatan>
          <button
            type="button"
            data-panduan="lokasi-koordinat"
            onClick={ambilKoordinat}
            disabled={deteksi === "mencari"}
            className={KELAS_TOMBOL_GARIS + " self-start"}
          >
            {deteksi === "mencari" ? "Mencari lokasi..." : "Ambil koordinat dari perangkat ini"}
          </button>
          {deteksi === "berhasil" && (
            <p role="status" className="text-isi">
              Koordinat terisi dari perangkat ini. Pastikan Anda memang sedang berada di {teks.tempat}.
            </p>
          )}
          {deteksi === "gagal" && (
            <p role="alert" className="text-isi font-medium text-destructive">
              Lokasi perangkat tidak bisa dibaca. Izinkan akses lokasi di browser, atau isi koordinat secara
              manual.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-[1_1_160px] flex-col gap-1.5">
              <label htmlFor={id("lat")} className="text-isi font-semibold">
                Latitude
              </label>
              <input
                id={id("lat")}
                inputMode="decimal"
                {...register("latitude")}
                aria-invalid={errors.latitude ? true : undefined}
                className={KELAS_ISIAN + " tabular-nums"}
              />
              <PesanIsian pesan={errors.latitude?.message} />
            </div>
            <div className="flex flex-[1_1_160px] flex-col gap-1.5">
              <label htmlFor={id("lng")} className="text-isi font-semibold">
                Longitude
              </label>
              <input
                id={id("lng")}
                inputMode="decimal"
                {...register("longitude")}
                aria-invalid={errors.longitude ? true : undefined}
                className={KELAS_ISIAN + " tabular-nums"}
              />
              <PesanIsian pesan={errors.longitude?.message} />
            </div>
          </div>
          <div data-panduan="lokasi-radius" className="flex flex-col gap-1.5">
            <label htmlFor={id("radius")} className="text-isi font-semibold">
              Radius absen (meter)
            </label>
            <input
              id={id("radius")}
              inputMode="numeric"
              {...register("radiusAbsen")}
              aria-describedby={id("radius-bantu")}
              aria-invalid={errors.radiusAbsen ? true : undefined}
              className={KELAS_ISIAN + " max-w-[200px]"}
            />
            <p id={id("radius-bantu")} className={KELAS_BANTU}>
              10 sampai 50 meter dari titik koordinat.
            </p>
            <PesanIsian pesan={errors.radiusAbsen?.message} />
          </div>
        </section>

        {teks.catatanAkhir && <p className="text-isi leading-normal text-muted-foreground">{teks.catatanAkhir}</p>}
        <PesanGalat pesan={galat} />
        <NavigasiLangkah onKembali={onKembali} onLewati={onLewati} teksLanjut={teksLanjut} sibuk={sibuk} />
      </form>

      <AlertDialog
        open={konfirmasi !== null}
        onOpenChange={(buka) => {
          if (!buka) setKonfirmasi(null);
        }}
      >
        <AlertDialogContent className="gap-4 rounded-[20px] p-7 text-navy">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-judul font-bold">Yakin Anda sedang di {teks.tempat}?</AlertDialogTitle>
            <AlertDialogDescription>
              Koordinat ini menjadi titik absen <strong>{konfirmasi?.nama}</strong>. Bila Anda tidak sedang berada
              di {teks.tempat} itu, batalkan dan ambil ulang saat sudah di sana.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="rounded-xl bg-krem px-3.5 py-3 text-isi tabular-nums">
            {konfirmasi?.latitude}, {konfirmasi?.longitude}
          </p>
          <div className="flex flex-wrap justify-end gap-2.5">
            <AlertDialogCancel className="h-12 rounded-xl border-input px-5 text-besar font-semibold text-navy">
              Batal
            </AlertDialogCancel>
            <button
              type="button"
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl bg-navy px-5 text-besar font-semibold text-gading hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel focus-visible:ring-offset-2"
              onClick={() => {
                const nilai = konfirmasi;
                setKonfirmasi(null);
                if (nilai) void kirim(nilai);
              }}
            >
              Ya, saya di {teks.tempat}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}