"use client";

import { useState } from "react";
import { Moon } from "lucide-react";
import { InputWaktu } from "@/components/input-waktu";
import { cn } from "@/lib/utils";
import { waktuLengkap, type NilaiWaktu } from "@/lib/waktu";
import {
  JudulLangkah,
  KotakPeringatan,
  NavigasiLangkah,
  PesanGalat,
  PesanIsian,
  PilihanTombol,
  type OpsiPilihan,
} from "./bagian";
import { KELAS_BANTU, KELAS_LABEL, KELAS_TOMBOL_GARIS } from "./gaya";
import {
  bolehSamakan,
  HARI,
  masalahHari,
  masalahJamBuka,
  penutupan,
  ringkasHari,
  samakanSemua,
  segmenHari,
  semuaLibur,
  sumberSamakan,
  type JamHari,
  type ModeJamBuka,
  type NilaiJamBuka,
  type StatusHari,
} from "./jam-buka";
import { useKirim } from "./kirim";
import type { PropsLangkah } from "./langkah";

const OPSI_MODE: readonly OpsiPilihan<ModeJamBuka>[] = [
  { nilai: "24jam", label: "Buka 24 jam", keterangan: "Setiap hari, tanpa tutup" },
  { nilai: "tertentu", label: "Jam tertentu", keterangan: "Atur jam buka dan tutup tiap hari" },
];

const OPSI_STATUS: readonly { nilai: StatusHari; label: string }[] = [
  { nilai: "buka", label: "Buka" },
  { nilai: "24jam", label: "24 jam" },
  { nilai: "libur", label: "Libur" },
];

const KELAS_STATUS =
  "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl text-isi font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel";

const TANDA_BILAH = ["00", "06", "12", "18", "24"] as const;

/**
 * Isian jam memakai InputWaktu (keputusan rancangan butir 22); tampilannya
 * disamakan dengan isian setup lain hanya di langkah ini (pemilik proyek,
 * 7 November 2026). Garis abu dilepas selama isian salah agar garis merah
 * InputWaktu tetap tampil.
 */
function IsianJam({
  id,
  label,
  namaHari,
  value,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  namaHari: string;
  value: NilaiWaktu;
  onChange: (w: NilaiWaktu) => void;
  invalid: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-[1_1_150px] flex-col gap-2">
      <label htmlFor={id} className={KELAS_LABEL}>
        {label}
      </label>
      <InputWaktu
        id={id}
        label={`${label} ${namaHari}`}
        value={value}
        onChange={onChange}
        invalid={invalid}
        className={cn(
          "rounded-xl bg-permukaan focus-within:ring-2 focus-within:ring-karamel",
          !invalid && "border-input",
        )}
      />
    </div>
  );
}

/**
 * Satu hari (desain C, garis waktu): nama dan ringkasan jam, bilah 00 sampai
 * 24 sebagai hiasan, keterangan tutup keesokan harinya, status, lalu isian.
 */
function KartuHari({
  indeks,
  hari,
  cek,
  onUbah,
}: {
  indeks: number;
  hari: JamHari;
  cek: boolean;
  onUbah: (hari: JamHari) => void;
}) {
  const nama = HARI[indeks];
  const tutup = penutupan(hari, indeks);
  const segmen = segmenHari(hari);
  const masalah = cek ? masalahHari(hari) : null;
  const bukaSalah = masalah !== null && !waktuLengkap(hari.buka);
  const tutupSalah = masalah !== null && (waktuLengkap(hari.buka) || !waktuLengkap(hari.tutup));

  return (
    <li
      aria-label={nama}
      className={cn(
        "flex flex-col gap-3.5 rounded-2xl border border-input p-[18px]",
        hari.status === "libur" ? "bg-gading" : "bg-permukaan",
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-subjudul font-bold leading-snug">{nama}</h2>
        <span className="text-besar font-semibold">{ringkasHari(hari)}</span>
      </div>
      <div aria-hidden="true" className="flex flex-col gap-1">
        <div className="relative h-3 overflow-hidden rounded-full bg-krem">
          <div
            className={cn("absolute inset-y-0 bg-navy", segmen.lewatMalam ? "rounded-l-full" : "rounded-full")}
            style={{ left: `${segmen.kiri}%`, width: `${segmen.lebar}%` }}
          />
        </div>
        <div className="flex justify-between text-kecil text-muted-foreground">
          {TANDA_BILAH.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
      {tutup?.jenis === "besok" && (
        <p className="flex items-start gap-2.5 rounded-xl border border-karamel/60 bg-karamel/15 px-3.5 py-2.5 text-isi leading-normal">
          <Moon className="mt-0.5 h-[18px] w-[18px] flex-none" aria-hidden="true" />
          <strong className="font-semibold">{tutup.teks}</strong>
        </p>
      )}
      <div role="group" aria-label={`Status ${nama}`} className="flex flex-wrap gap-1.5">
        {OPSI_STATUS.map((o) => {
          const aktif = hari.status === o.nilai;
          return (
            <button
              key={o.nilai}
              type="button"
              aria-pressed={aktif}
              onClick={() => onUbah({ ...hari, status: o.nilai })}
              className={cn(
                KELAS_STATUS,
                aktif ? "border-2 border-navy bg-gading px-3.5" : "border border-input bg-permukaan px-[15px]",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hari.status === "buka" && (
        <div className="flex flex-wrap gap-3">
          <IsianJam
            id={`setup-jam-${indeks}-buka`}
            label="Jam buka"
            namaHari={nama}
            value={hari.buka}
            onChange={(buka) => onUbah({ ...hari, buka })}
            invalid={bukaSalah}
          />
          <IsianJam
            id={`setup-jam-${indeks}-tutup`}
            label="Jam tutup"
            namaHari={nama}
            value={hari.tutup}
            onChange={(tutup) => onUbah({ ...hari, tutup })}
            invalid={tutupSalah}
          />
        </div>
      )}
      {hari.status === "24jam" && (
        <p className="text-isi text-muted-foreground">Buka sepanjang hari, tanpa jam tutup</p>
      )}
      {hari.status === "libur" && <p className="text-isi text-muted-foreground">Toko tutup seharian</p>}
      {tutup?.jenis === "sama" && <p className={KELAS_BANTU}>{tutup.teks}</p>}
      <PesanIsian pesan={masalah ?? undefined} />
    </li>
  );
}

/**
 * Langkah jam buka toko (modul/setup-akun.md, keputusan 7 November 2026).
 * Belum tersambung ke backend: B206 hanya menyimpan satu pasang jam untuk
 * semua hari, sehingga langkah ini baru dipakai rute pratinjau (keputusan
 * rancangan butir 30) dan onLanjut menerima nilai per hari apa adanya.
 */
export function LangkahJamBuka({ nomor, total, teksLanjut, awal, onLanjut, onKembali }: PropsLangkah<NilaiJamBuka>) {
  const [nilai, setNilai] = useState(awal);
  const [cek, setCek] = useState(false);
  const { kirim, sibuk, galat } = useKirim(onLanjut, "Gagal menyimpan jam buka.");
  const masalah = cek ? masalahJamBuka(nilai) : null;
  const sumber = sumberSamakan(nilai.hari);

  const ubahHari = (i: number, hari: JamHari) =>
    setNilai((n) => ({ ...n, hari: n.hari.map((h, k) => (k === i ? hari : h)) }));
  const simpan = () => {
    setCek(true);
    if (masalahJamBuka(nilai) === null) void kirim(nilai);
  };

  return (
    <div className="flex flex-col gap-6">
      <JudulLangkah
        nomor={nomor}
        total={total}
        judul="Jam buka toko"
        keterangan="Kapan toko melayani pembeli. Jam ini dipakai untuk menyusun shift karyawan."
      />
      <PilihanTombol
        id="setup-jam-mode"
        pertanyaan="Toko buka kapan?"
        opsi={OPSI_MODE}
        nilai={nilai.mode}
        onUbah={(mode) => setNilai((n) => ({ ...n, mode }))}
      />
      {nilai.mode === "tertentu" && (
        <>
          <ol aria-label="Jam buka per hari" className="flex flex-col gap-3">
            {nilai.hari.map((h, i) => (
              <KartuHari key={HARI[i]} indeks={i} hari={h} cek={cek} onUbah={(baru) => ubahHari(i, baru)} />
            ))}
          </ol>
          {bolehSamakan(nilai.hari) && (
            <button
              type="button"
              onClick={() => setNilai((n) => ({ ...n, hari: samakanSemua(n.hari) }))}
              className={KELAS_TOMBOL_GARIS + " self-start"}
            >
              Samakan semua hari dengan {HARI[sumber]}
            </button>
          )}
          {semuaLibur(nilai) && (
            <KotakPeringatan>
              <strong className="font-semibold">Semua hari libur.</strong> Toko tercatat tutup setiap hari sampai
              jam bukanya diubah dari Pengaturan, Profil Toko.
            </KotakPeringatan>
          )}
        </>
      )}
      <PesanGalat pesan={galat || masalah || ""} />
      <NavigasiLangkah onKembali={onKembali} onLanjut={simpan} teksLanjut={teksLanjut} sibuk={sibuk} />
    </div>
  );
}