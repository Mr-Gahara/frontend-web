"use client";

import { useId, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface OpsiTombol<T extends string> {
  nilai: T;
  label: string;
}

/**
 * Pilihan tunggal berupa tombol desain B (pemilik proyek, 24 November
 * 2026): "grid" untuk Plan (tiga kolom sama lebar), "chip" untuk durasi
 * (membungkus). Berperan radiogroup: panah kiri dan kanan berpindah dan
 * memilih, dan hanya pilihan aktif yang masuk urutan Tab.
 */
export function PilihanTombol<T extends string>({
  label,
  opsi,
  nilai,
  onUbah,
  bentuk,
  disabled,
  invalid,
  keterangan,
}: {
  label: string;
  opsi: readonly OpsiTombol<T>[];
  nilai: T | "";
  onUbah: (nilai: T) => void;
  bentuk: "grid" | "chip";
  disabled?: boolean;
  invalid?: boolean;
  keterangan?: string;
}) {
  const idLabel = useId();
  const idKeterangan = useId();
  const indeksAktif = Math.max(
    0,
    opsi.findIndex((o) => o.nilai === nilai),
  );

  const geser = (e: KeyboardEvent<HTMLButtonElement>, indeks: number) => {
    const arah = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!arah) return;
    e.preventDefault();
    const berikut = (indeks + arah + opsi.length) % opsi.length;
    onUbah(opsi[berikut].nilai);
    const grup = e.currentTarget.parentElement;
    grup?.querySelectorAll<HTMLButtonElement>("[role=radio]")[berikut]?.focus();
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span id={idLabel} className="text-isi font-semibold">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={idLabel}
        aria-describedby={keterangan ? idKeterangan : undefined}
        aria-invalid={invalid || undefined}
        className={cn(bentuk === "grid" ? "grid grid-cols-3 gap-2" : "flex flex-wrap gap-2")}
      >
        {opsi.map((o, i) => {
          const terpilih = o.nilai === nilai;
          return (
            <button
              key={o.nilai}
              type="button"
              role="radio"
              aria-checked={terpilih}
              tabIndex={i === indeksAktif ? 0 : -1}
              disabled={disabled}
              onClick={() => onUbah(o.nilai)}
              onKeyDown={(e) => geser(e, i)}
              className={cn(
                "min-w-0 cursor-pointer truncate text-isi transition-colors focus-visible:ring-2 focus-visible:ring-navy/40 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                bentuk === "grid" ? "h-[42px] rounded-lg px-2" : "h-9 rounded-full px-3",
                terpilih
                  ? "border-2 border-navy bg-navy font-bold text-gading"
                  : cn(
                      "border bg-permukaan font-semibold text-navy hover:bg-krem-hover",
                      invalid ? "border-destructive" : "border-navy/20",
                    ),
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {keterangan && (
        <p id={idKeterangan} className="text-kecil text-muted-foreground">
          {keterangan}
        </p>
      )}
    </div>
  );
}
