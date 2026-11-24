import { cn } from "@/lib/utils";
import type { AkunAdmin } from "@/types/adminAkun";
import { statusLencana, type StatusLencana } from "./tampilan";

const WARNA: Record<StatusLencana["nada"], { lencana: string; titik: string; teks: string }> = {
  aktif: { lencana: "bg-sage-pucat text-sage-tua", titik: "bg-sage-tua", teks: "text-sage-tua" },
  kedaluwarsa: { lencana: "bg-krem text-karamel-tua", titik: "bg-karamel-tua", teks: "text-karamel-tua" },
  beku: { lencana: "bg-rose-redup/12 text-rose-redup", titik: "bg-rose-redup", teks: "text-rose-redup" },
};

/**
 * Lencana status akun gaya A di daftar dan detail (pemilik proyek,
 * 24 November 2026): Aktif atau Non-aktif, dengan alasan non-aktif di
 * bawahnya.
 */
export function LencanaStatus({ akun, className }: { akun: AkunAdmin; className?: string }) {
  const status = statusLencana(akun);
  const warna = WARNA[status.nada];
  return (
    <span className={cn("inline-flex flex-col items-start gap-0.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-kecil font-semibold",
          warna.lencana,
        )}
      >
        <span aria-hidden="true" className={cn("size-1.5 rounded-full", warna.titik)} />
        {status.label}
      </span>
      {status.keterangan && <span className={cn("text-kecil", warna.teks)}>{status.keterangan}</span>}
    </span>
  );
}
