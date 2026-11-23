"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { bulanSesudahIni, geserBulan, labelBulan } from "@/lib/unduh";

/**
 * Pemilih bulan ‹ November 2026 ›: bulan yang belum datang tidak dapat
 * dipilih. Dipakai dialog unduh daftar dan laman Rekap Absensi.
 */
export function PemilihBulan({
  bulan,
  onUbah,
  hariIni,
  idLabel,
  label,
  className,
}: {
  /** Tanggal 1 bulan terpilih. */
  bulan: Date;
  onUbah: (bulan: Date) => void;
  hariIni: Date;
  /** id elemen label yang terlihat, atau label lewat aria-label. */
  idLabel?: string;
  label?: string;
  className?: string;
}) {
  const berikutnya = geserBulan(bulan, 1);
  return (
    <div
      role="group"
      aria-labelledby={idLabel}
      aria-label={idLabel ? undefined : (label ?? "Bulan")}
      className={cn("flex h-[42px] items-center justify-between rounded-[10px] border border-navy/20 bg-permukaan", className)}
    >
      <button
        type="button"
        aria-label="Bulan sebelumnya"
        onClick={() => onUbah(geserBulan(bulan, -1))}
        className="flex h-full w-11 shrink-0 cursor-pointer items-center justify-center rounded-l-[10px] text-navy hover:bg-navy/5"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <span aria-live="polite" className="min-w-0 truncate px-1 text-isi font-bold capitalize text-navy">
        {labelBulan(bulan)}
      </span>
      <button
        type="button"
        aria-label="Bulan berikutnya"
        disabled={bulanSesudahIni(berikutnya, hariIni)}
        onClick={() => onUbah(berikutnya)}
        className="flex h-full w-11 shrink-0 cursor-pointer items-center justify-center rounded-r-[10px] text-navy hover:bg-navy/5 disabled:cursor-not-allowed disabled:text-navy/30 disabled:hover:bg-transparent"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
