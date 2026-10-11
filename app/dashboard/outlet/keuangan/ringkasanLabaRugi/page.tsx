"use client";

import React, { useState, useMemo } from "react";
import { LineChart as LineChartIcon, AlertTriangle } from "lucide-react";
import {
  GrafikLaporan,
  type TitikGrafik,
} from "@/features/laporan/grafik-laporan";

import { Skeleton } from "@/components/ui/skeleton";
import { useLabaRugi } from "@/features/laporan/hooks";
import {
  jumlahkan,
  persentasePertumbuhan,
  rentangPeriode,
  rentangPeriodeSebelumnya,
  teksPertumbuhan,
  type PeriodeLaporan,
} from "@/features/laporan/periode";
import { formatRupiah } from "@/lib/format";

// Types
type FilterPeriode = PeriodeLaporan;

type DataPoint = TitikGrafik;

// Filter toggle
function PeriodeToggle({
  active,
  value,
  onClick,
  children,
}: {
  active: FilterPeriode;
  value: FilterPeriode;
  onClick: (v: FilterPeriode) => void;
  children: React.ReactNode;
}) {
  const isActive = active === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`px-1 sm:px-4 py-1.5 text-[10px] min-[375px]:text-xs sm:text-sm font-bold rounded-md transition-colors cursor-pointer w-full flex items-center justify-center text-center overflow-hidden ${
        isActive
          ? "bg-sage text-gading shadow-sm"
          : "text-navy/60 hover:text-navy"
      }`}
    >
      <span className="truncate w-full">{children}</span>
    </button>
  );
}

export default function RingkasanLabaRugiPage() {
  const [periode, setPeriode] = useState<FilterPeriode>("bulanan");

  // Rentang periode berjalan dan pembandingnya (keputusan KU5a).
  const rentang = useMemo(() => rentangPeriode(periode), [periode]);
  const rentangSebelumnya = useMemo(() => rentangPeriodeSebelumnya(periode), [periode]);

  const { data: laporanList = [], isLoading, isError } = useLabaRugi(rentang);
  const { data: laporanSebelumnya } = useLabaRugi(rentangSebelumnya);

  const { chartData, totalNilai, pertumbuhan, persentaseNaikTurun } = useMemo(() => {
    const processedData: DataPoint[] = laporanList.map((item) => ({
      label: item.tanggal || "-",
      nilai: item.totalLabaBersih || 0,
    }));

    const currentTotal = jumlahkan(laporanList, "totalLabaBersih");

    // Tanpa data pembanding (memuat, gagal, atau laba sebelumnya 0) badge menampilkan "-".
    const pertumbuhan = laporanSebelumnya
      ? persentasePertumbuhan(currentTotal, jumlahkan(laporanSebelumnya, "totalLabaBersih"))
      : null;

    return {
      chartData: processedData,
      totalNilai: currentTotal,
      pertumbuhan,
      persentaseNaikTurun: teksPertumbuhan(pertumbuhan),
    };
  }, [laporanList, laporanSebelumnya]);

  const labelPeriode = {
    harian: "Laba Hari Ini",
    mingguan: "Laba Minggu Ini",
    bulanan: "Laba Bulan Ini",
  }[periode];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Chart card */}
      <div className="bg-krem border border-navy/10 rounded-2xl p-5 sm:p-6 text-navy shadow-sm flex flex-col w-full gap-6 overflow-hidden">
        {/* Toolbar chart */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-karamel rounded-lg shadow-sm shrink-0">
              <LineChartIcon className="w-5 h-5 text-gading" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide text-navy">
                Arus Kas &amp; Laba Bersih
              </h2>
              <p className="text-xs text-navy/70 font-medium">
                {labelPeriode}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:flex w-full md:w-auto bg-[#675a41]/20 rounded-lg p-1 border border-navy/10 shadow-inner gap-0.5 sm:gap-0">
            <PeriodeToggle active={periode} value="harian" onClick={setPeriode}>
              Harian
            </PeriodeToggle>
            <PeriodeToggle
              active={periode}
              value="mingguan"
              onClick={setPeriode}
            >
              Mingguan
            </PeriodeToggle>
            <PeriodeToggle
              active={periode}
              value="bulanan"
              onClick={setPeriode}
            >
              Bulanan
            </PeriodeToggle>
          </div>
        </div>

        {/* LOADING & ERROR STATES */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-48 bg-navy/10 rounded-md" />
            <Skeleton className="h-64 w-full bg-navy/5 rounded-xl" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-navy/60">
            <AlertTriangle className="w-10 h-10 text-rose-500/50" />
            <p className="font-bold">Gagal memuat data laporan.</p>
          </div>
        ) : (
          <>
            {/* Total nilai */}
            <div>
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-navy">
                {formatRupiah(totalNilai)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={
                    pertumbuhan === null || pertumbuhan === 0
                      ? "text-xs text-navy/60 font-bold"
                      : pertumbuhan > 0
                        ? "text-xs text-sage font-bold"
                        : "text-xs text-rose-500 font-bold"
                  }
                >
                  {persentaseNaikTurun}
                </span>
                <span className="text-xs text-navy/60 font-medium">
                  vs periode sebelumnya
                </span>
              </div>
            </div>

            {/* Chart */}
            <div className="w-full h-62.5 sm:h-87.5 md:h-100 mt-2">
              <GrafikLaporan
                data={chartData}
                interval={
                  periode === "harian" ? 4 : periode === "bulanan" ? 4 : 0
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
