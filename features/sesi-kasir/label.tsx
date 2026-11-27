import { cn } from "@/lib/utils";
import type { StatusPeriodeKasir } from "@/types/sesiKasir";
import { LABEL_STATUS_PERIODE } from "./laporan";
import type { LabelSelisih, NadaSelisih } from "./tampilan";

const LATAR_SELISIH: Record<NadaSelisih, string> = {
  pas: "bg-sage/20",
  lebih: "bg-karamel/30",
  kurang: "bg-karamel/60",
  kosong: "bg-navy/5",
};

/** Label selisih uang. Maknanya terbaca dari teks (Pas, Lebih, Kurang); warna hanya penguat. */
export function ChipSelisih({
  selisih,
  awalan,
  className,
}: {
  selisih: LabelSelisih;
  awalan?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-isi text-navy",
        LATAR_SELISIH[selisih.nada],
        className,
      )}
    >
      {awalan && <span className="text-navy/70">{awalan}</span>}
      <strong className="font-bold">{selisih.teks}</strong>
    </span>
  );
}

/** Status kasir di sebuah mesin kasir. */
export function ChipStatusKasir({ buka }: { buka: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-isi font-semibold text-navy",
        buka ? "bg-sage/20" : "bg-navy/5",
      )}
    >
      {buka ? "Buka" : "Tutup"}
    </span>
  );
}
/**
 * Status periode laporan tutup kasir (PW10): Selesai sage, Berjalan karamel
 * muda (pemilik proyek, 27 November 2026); maknanya tetap terbaca dari teks.
 */
export function BadgeStatusPeriode({ status, className }: { status: StatusPeriodeKasir; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-kecil font-bold text-navy",
        status === "BUKA" ? "bg-karamel/35" : "bg-sage/20",
        className,
      )}
    >
      {LABEL_STATUS_PERIODE[status]}
    </span>
  );
}
