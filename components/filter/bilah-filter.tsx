"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PilFilter } from "@/lib/filter";
import { cn } from "@/lib/utils";

/**
 * Bilah filter seragam (FL1a, kanvas "Popup Filter", desain gabungan):
 * kotak cari selalu tampil di kiri dan tombol "Filter lainnya" berlencana di
 * kanan, lalu pil filter aktif di bawahnya. Halaman tanpa kotak cari hanya
 * memasang tombolnya (FL7a); halaman tanpa panel hanya memasang KotakCari
 * (FL6a).
 */

interface PropsKotakCari {
  id: string;
  /** Nama aksesibel, misalnya "Cari nomor referensi". */
  label: string;
  placeholder: string;
  value: string;
  onChange: (nilai: string) => void;
  className?: string;
  disabled?: boolean;
  /** Batas panjang pencarian server (PANJANG_CARI_SERVER dan sejenisnya). */
  maxLength?: number;
}

/** Kotak cari seragam: 32 px di HP, 44 px mulai 640 px, ikon cari di kiri. */
export function KotakCari({ id, label, placeholder, value, onChange, className, disabled, maxLength }: PropsKotakCari) {
  return (
    <div className={cn("relative w-full min-w-0 sm:w-80", className)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy/50"
      />
      <Input
        id={id}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        className="h-8 rounded-lg border-navy/20 bg-permukaan pl-9 text-navy placeholder:text-navy/40 sm:h-11"
      />
    </div>
  );
}

interface PropsTombolFilter {
  jumlahAktif: number;
  onBuka: () => void;
  terbuka?: boolean;
  disabled?: boolean;
}

/** Tombol "Filter lainnya" dengan lencana jumlah filter aktif; di HP ikon dan lencana saja. */
export function TombolFilter({ jumlahAktif, onBuka, terbuka, disabled }: PropsTombolFilter) {
  const aktif = jumlahAktif > 0;
  return (
    <Button
      type="button"
      variant="outline"
      size="aksi"
      onClick={onBuka}
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={terbuka ?? false}
      aria-label={aktif ? `Filter lainnya, ${jumlahAktif} aktif` : "Filter lainnya"}
      className={cn(
        "shrink-0 cursor-pointer text-navy hover:bg-navy/5",
        aktif ? "border-navy bg-navy/5" : "border-navy/20 bg-transparent",
      )}
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      <span className="hidden sm:inline">Filter lainnya</span>
      {aktif && (
        <span
          aria-hidden="true"
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-karamel px-1.5 text-kecil font-bold text-navy"
        >
          {jumlahAktif}
        </span>
      )}
    </Button>
  );
}

interface PropsBilahFilter {
  /** Kotak cari di kiri; tanpa ini tombol Filter rata kanan (FL7a). */
  cari?: PropsKotakCari;
  jumlahAktif: number;
  onBukaFilter: () => void;
  filterTerbuka?: boolean;
  pil: PilFilter[];
  onAturUlangSemua: () => void;
  /** Halaman dengan penghalang (lokasi gagal dimuat): cari dan Filter mati. */
  nonaktif?: boolean;
}

export function BilahFilter({ cari, jumlahAktif, onBukaFilter, filterTerbuka, pil, onAturUlangSemua, nonaktif }: PropsBilahFilter) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {cari ? (
          <KotakCari {...cari} disabled={nonaktif || cari.disabled} className={cn("flex-1 sm:flex-none", cari.className)} />
        ) : (
          <span />
        )}
        <TombolFilter jumlahAktif={jumlahAktif} onBuka={onBukaFilter} terbuka={filterTerbuka} disabled={nonaktif} />
      </div>
      <PilFilterAktif pil={pil} onAturUlangSemua={onAturUlangSemua} />
    </div>
  );
}

/** Deretan pil filter aktif dan "Atur ulang semua" (FL4a); tidak tampil bila kosong. */
export function PilFilterAktif({ pil, onAturUlangSemua }: { pil: PilFilter[]; onAturUlangSemua: () => void }) {
  if (pil.length === 0) return null;
  return (
    <div role="group" aria-label="Filter aktif" className="flex flex-wrap items-center gap-2">
      <span className="hidden text-kecil font-bold text-navy/70 sm:inline">Filter aktif:</span>
      {pil.map((p) => (
        <button
          key={p.kunci}
          type="button"
          onClick={p.onHapus}
          aria-label={`Hapus filter ${p.label}`}
          className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-navy/20 bg-krem px-2.5 text-kecil font-semibold text-navy hover:border-navy/40 focus-visible:ring-2 focus-visible:ring-navy/50 focus-visible:outline-none"
        >
          {p.label}
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={onAturUlangSemua}
        className="ml-1 cursor-pointer text-kecil font-bold text-navy underline underline-offset-4 hover:text-karamel-tua"
      >
        Atur ulang semua
      </button>
    </div>
  );
}
