"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAMA_TINGKAT, type Pemberitahuan, type TingkatPemberitahuan } from "./jenis";

/** Warna per tingkat LN11a: penting rose, perlu tindakan karamel, info navy. */
export const GAYA_TINGKAT: Record<TingkatPemberitahuan, { kartu: string; ikon: string; bilah: string }> = {
  penting: { kartu: "bg-rose-50", ikon: "bg-rose-100 text-rose-800", bilah: "bg-rose-600" },
  tindakan: { kartu: "bg-krem", ikon: "bg-karamel/30 text-karamel-tua", bilah: "bg-karamel" },
  info: { kartu: "bg-navy/5", ikon: "bg-navy/10 text-navy", bilah: "bg-navy" },
};

const IKON: Record<TingkatPemberitahuan, typeof Info> = { penting: AlertTriangle, tindakan: Clock, info: Info };


/**
 * Satu pemberitahuan: ikon tingkat, judul, kalimat, bilah (langganan), dan
 * tautan aksi yang sudah disaring izin (LN12a). Dipakai panel lonceng dan
 * pesan halaman (LN15a), sehingga isinya selalu sama.
 */
export function KartuPemberitahuan({
  pemberitahuan: p,
  onBukaTautan,
  className,
}: {
  pemberitahuan: Pemberitahuan;
  /** Dipanggil saat tautan diklik, misalnya untuk menutup panel lonceng. */
  onBukaTautan?: () => void;
  className?: string;
}) {
  const gaya = GAYA_TINGKAT[p.tingkat];
  const Ikon = IKON[p.tingkat];
  return (
    <article
      aria-label={p.judul}
      data-pemberitahuan={p.id}
      data-tingkat={p.tingkat}
      className={cn("flex flex-col gap-2.5 rounded-xl p-3.5 text-navy", gaya.kartu, className)}
    >
      <div className="flex items-start gap-2.5">
        <span className={cn("flex h-8 w-8 flex-none items-center justify-center rounded-full", gaya.ikon)}>
          <Ikon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">{NAMA_TINGKAT[p.tingkat]}</span>
        </span>
        <div className="min-w-0">
          <p className="text-isi font-bold">{p.judul}</p>
          <p className="mt-0.5 text-kecil text-navy/80">{p.isi}</p>
        </div>
      </div>
      {p.persen !== undefined && p.persen !== null && (
        <div className="h-1.5 rounded-full bg-navy/10" aria-hidden="true">
          <div className={cn("h-1.5 rounded-full", gaya.bilah)} style={{ width: `${p.persen}%` }} />
        </div>
      )}
      {p.tautan.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {p.tautan.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              onClick={onBukaTautan}
              className="inline-flex h-9 items-center rounded-lg bg-navy px-3.5 text-isi font-semibold text-gading hover:bg-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karamel"
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
