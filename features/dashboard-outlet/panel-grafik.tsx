"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, LineChart as IkonGrafik } from "lucide-react";

import { titikOmzet } from "./kartu";
import { Skeleton } from "@/components/ui/skeleton";
import { useLabaRugi } from "@/features/laporan/hooks";
import {
  jumlahkan,
  persentasePertumbuhan,
  rentangPeriode,
  rentangPeriodeSebelumnya,
  teksPertumbuhan,
} from "@/features/laporan/periode";
import { formatRupiah } from "@/lib/format";

/** Grafik omzet per tanggal bulan berjalan (keputusan DB5a). */

/*
 * Recharts adalah potongan JS terbesar di dashboard (sekitar 320 KB sebelum
 * kompresi). Grafik dimuat terpisah agar bagian lain dashboard tidak
 * menunggunya; unduhannya dimulai saat panel dipasang, paralel dengan
 * pengambilan data laba rugi, sehingga grafik tidak tampil lebih lambat.
 */
const muatGrafik = () => import("@/features/laporan/grafik-laporan").then((m) => m.GrafikLaporan);
const GrafikLaporan = dynamic(muatGrafik, {
  loading: () => <Skeleton className="h-full w-full bg-navy/5 rounded-xl" />,
});

export function PanelGrafik({ hari }: { hari: Date }) {
  useEffect(() => {
    void muatGrafik();
  }, []);
  const kini = useLabaRugi(rentangPeriode("bulanan", hari));
  const lalu = useLabaRugi(rentangPeriodeSebelumnya("bulanan", hari));
  const total = jumlahkan(kini.data ?? [], "totalOmzet");
  const pertumbuhan = lalu.data
    ? persentasePertumbuhan(total, jumlahkan(lalu.data, "totalOmzet"))
    : null;
  const lencana =
    pertumbuhan === null || pertumbuhan === 0
      ? "bg-navy/10 text-navy/70"
      : pertumbuhan > 0
        ? "bg-sage/15 text-[#4F5E3A]"
        : "bg-rose-100 text-rose-700";

  return (
    <section
      aria-label="Pendapatan Bulan Ini"
      className="bg-krem border border-navy/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-navy shadow-sm flex flex-col gap-3 sm:gap-4 h-full"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-karamel rounded-xl shadow-sm shrink-0">
          <IkonGrafik className="w-5 h-5 text-gading" aria-hidden="true" />
        </div>
        <h2 className="text-sm sm:text-lg font-bold tracking-wide">Pendapatan Bulan Ini</h2>
      </div>
      {kini.isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48 bg-navy/10 rounded-md" />
          <Skeleton className="h-64 w-full bg-navy/5 rounded-xl" />
        </div>
      ) : kini.isError ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-navy/60">
          <AlertTriangle className="w-10 h-10 text-rose-500/50" />
          <p className="font-bold">Gagal memuat data pendapatan.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-xl sm:text-3xl font-black tracking-tight">{formatRupiah(total)}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lencana}`}>
              {teksPertumbuhan(pertumbuhan)}
            </span>
            <span className="text-xs text-navy/60 font-medium">vs periode sebelumnya</span>
          </div>
          <div className="w-full h-44 sm:h-80">
            <GrafikLaporan data={titikOmzet(kini.data ?? [])} interval={4} />
          </div>
        </>
      )}
    </section>
  );
}