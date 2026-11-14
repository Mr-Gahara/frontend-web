"use client";

import { CircleHelp } from "lucide-react";
import { TurSorotan, usePanduan } from "@/components/panduan/tur-sorotan";
import type { TitikPanduan } from "@/lib/panduan";
import type { KunciLangkah } from "./langkah";

export interface PanduanLangkah {
  kunci: KunciLangkah;
  titik: readonly TitikPanduan[];
}

/**
 * Tautan Lihat panduan di samping nomor langkah (gaya A kanvas "Panduan
 * Wizard Setup", pemilik proyek, 7 November 2026) beserta turnya. Tur tampil
 * sendiri saat langkah pertama kali dibuka di perangkat ini, dengan kunci
 * setup.<kunci langkah>. Ringkasan langkah tersimpan tidak memakainya.
 */
export function TombolPanduanLangkah({ kunci, titik }: PanduanLangkah) {
  const { buka, mulai, tutup } = usePanduan("setup." + kunci);
  return (
    <>
      <button
        type="button"
        onClick={mulai}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-isi font-semibold text-navy underline decoration-karamel decoration-2 underline-offset-[3px] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
      >
        <CircleHelp className="h-4 w-4 flex-none text-karamel" aria-hidden="true" />
        Lihat panduan
      </button>
      <TurSorotan titik={titik} buka={buka} onTutup={tutup} />
    </>
  );
}