"use client";

import { Receipt, type LucideIcon } from "lucide-react";

import { useJumlahTransaksiLunas } from "./hooks";
import { hariMundur } from "./kartu";
import { Skeleton } from "@/components/ui/skeleton";
import { useLabaRugi } from "@/features/laporan/hooks";
import {
  jumlahkan,
  persentasePertumbuhan,
  rentangPeriode,
  teksPertumbuhan,
  type KolomNilaiLaporan,
} from "@/features/laporan/periode";
import { formatRupiah } from "@/lib/format";

/**
 * Satu kartu ringkas. nilai null berarti sumbernya gagal dimuat dan tampil
 * "-" (keputusan KU2a). Lencana persentase hijau saat naik, krem selain itu.
 */
function KartuRingkas({
  judul,
  ikon: Ikon,
  nilai,
  memuat,
  pertumbuhan,
  pembanding,
}: {
  judul: string;
  ikon: LucideIcon;
  nilai: string | null;
  memuat: boolean;
  pertumbuhan: number | null;
  pembanding: string;
}) {
  const lencana =
    pertumbuhan !== null && pertumbuhan > 0
      ? "bg-[#A3B18A]/20 text-[#A3B18A]"
      : "bg-[#F2EAE2]/10 text-[#F2EAE2]";
  return (
    <section
      aria-label={judul}
      className="bg-[#0A2947] text-[#FFFAF3] rounded-2xl sm:rounded-3xl border-t-4 border-[#D4A373] p-3 sm:p-5 flex flex-col justify-between gap-2 sm:gap-3 shadow-sm min-w-0 sm:min-h-36"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm font-semibold text-[#F2EAE2]/80 truncate min-w-0">{judul}</p>
        <span className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-[#D4A373]/20 text-[#D4A373] shrink-0">
          <Ikon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        </span>
      </div>
      {memuat ? (
        <Skeleton className="h-6 sm:h-8 w-24 sm:w-32 bg-[#FFFAF3]/15 rounded-md" />
      ) : (
        <p className="text-base sm:text-2xl font-black tracking-tight truncate">{nilai ?? "-"}</p>
      )}
      {!memuat && nilai === null ? (
        <p className="text-xs font-medium text-rose-300">Gagal memuat data</p>
      ) : (
        <p className="flex items-center gap-2 text-[11px] sm:text-xs">
          <span className={`px-2 py-0.5 rounded-full font-bold ${lencana}`}>
            {teksPertumbuhan(pertumbuhan)}
          </span>
          <span className="hidden sm:inline font-medium text-[#F2EAE2]/70">{pembanding}</span>
        </p>
      )}
    </section>
  );
}

/**
 * Kartu satu kolom laporan laba rugi untuk satu hari: mundur 0 hari ini,
 * 1 kemarin. Pembandingnya selalu hari sebelumnya (keputusan DB2a).
 */
export function KartuNilaiLaporan({
  judul,
  ikon,
  kolom,
  hari,
  mundur,
  pembanding,
}: {
  judul: string;
  ikon: LucideIcon;
  kolom: KolomNilaiLaporan;
  hari: Date;
  mundur: number;
  pembanding: string;
}) {
  const kini = useLabaRugi(rentangPeriode("harian", hariMundur(hari, mundur)));
  const lalu = useLabaRugi(rentangPeriode("harian", hariMundur(hari, mundur + 1)));
  const jumlah = jumlahkan(kini.data ?? [], kolom);
  return (
    <KartuRingkas
      judul={judul}
      ikon={ikon}
      memuat={kini.isLoading}
      nilai={kini.isError ? null : formatRupiah(jumlah)}
      pertumbuhan={lalu.data ? persentasePertumbuhan(jumlah, jumlahkan(lalu.data, kolom)) : null}
      pembanding={pembanding}
    />
  );
}

/** Kartu jumlah transaksi lunas hari ini, dibandingkan dengan kemarin (DB1a). */
export function KartuTransaksi({ hari }: { hari: Date }) {
  const kini = useJumlahTransaksiLunas(hari);
  const lalu = useJumlahTransaksiLunas(hariMundur(hari, 1));
  const jumlah = kini.data ?? null;
  return (
    <KartuRingkas
      judul="Transaksi Hari Ini"
      ikon={Receipt}
      memuat={kini.isLoading}
      nilai={kini.isError || jumlah === null ? null : `${jumlah} transaksi`}
      pertumbuhan={
        jumlah !== null && typeof lalu.data === "number"
          ? persentasePertumbuhan(jumlah, lalu.data)
          : null
      }
      pembanding="dari kemarin"
    />
  );
}