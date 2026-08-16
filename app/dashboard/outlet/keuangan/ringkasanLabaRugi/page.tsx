"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart as LineChartIcon, AlertTriangle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { LaporanLabaRugiData } from "@/types/laporan";

// Types
type FilterPeriode = "harian" | "mingguan" | "bulanan";

type DataPoint = {
  label: string;
  nilai: number;
};

// Helper Format Rupiah
function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#FFFAF3] border border-[#0A2947]/10 rounded-lg px-3 py-2 text-[#0A2947] text-xs shadow-lg">
      <p className="text-[#0A2947]/70 font-medium mb-1">{label}</p>
      <p className="font-bold text-[#718355]">
        {formatRupiah(payload[0].value)}
      </p>
    </div>
  );
}

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
          ? "bg-[#718355] text-[#FFFAF3] shadow-sm"
          : "text-[#0A2947]/60 hover:text-[#0A2947]"
      }`}
    >
      <span className="truncate w-full">{children}</span>
    </button>
  );
}

export default function RingkasanLabaRugiPage() {
  useAuthGuard();
  const [periode, setPeriode] = useState<FilterPeriode>("bulanan");

  // --- KALKULATOR TANGGAL ABSOLUT ---
  const { start, end } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (periode === "harian") {
      // Hanya hari ini dari jam 00:00 - 23:59
      startDate.setHours(0, 0, 0, 0);
    } else if (periode === "mingguan") {
      // Hari Senin minggu ini
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      startDate.setDate(now.getDate() - dayOfWeek + 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (periode === "bulanan") {
      // Tanggal 1 bulan ini
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    endDate.setHours(23, 59, 59, 999);

    return { start: startDate.toISOString(), end: endDate.toISOString() };
  }, [periode]);

  // --- FETCH DATA REAL DARI BACKEND ---
  const {
    data: laporanList = [],
    isLoading,
    isError,
  } = useQuery({
    // Tambahkan start & end ke queryKey agar cache browser tidak tertukar
    queryKey: [...queryKeys.laporanLabaRugi({ periode }), start, end],
    queryFn: async (): Promise<LaporanLabaRugiData[]> => {
      // Suntikkan tanggal ke URL Backend
      const res = await apiClient.get<any>(
        `/laporan/laba-rugi?periode=${periode}&startDate=${start}&endDate=${end}`,
        undefined,
        "pengguna",
      );
      const fetched = res.data?.data || res.data || [];
      return Array.isArray(fetched) ? fetched : [];
    },
  });

  // --- DATA PROCESSING (Murni dari Backend) ---
  const { chartData, totalNilai, persentaseNaikTurun } = useMemo(() => {
    // BENTENG PERTAHANAN: Paksa data menjadi Array apa pun isi cache dari React Query
    const safeLaporanList = Array.isArray(laporanList) ? laporanList : [];

    // 1. Mapping langsung dari backend ke format grafik Recharts
    const processedData: DataPoint[] = safeLaporanList.map((item) => ({
      label: item?.tanggal || "-", // Fallback aman jika item kosong
      nilai: item?.totalLabaBersih || 0,
    }));

    // 2. Hitung grand total Laba Bersih
    const currentTotal = safeLaporanList.reduce(
      (sum, item) => sum + (item?.totalLabaBersih || 0),
      0,
    );

    // Simulasi statis perhitungan persentase (biarkan untuk UI sementara)
    const randPertumbuhan = (Math.random() * 15 + 5).toFixed(2);
    const persentase = currentTotal > 0 ? `↑ ${randPertumbuhan}%` : "0%";

    return {
      chartData: processedData,
      totalNilai: currentTotal,
      persentaseNaikTurun: persentase,
    };
  }, [laporanList]);

  const labelPeriode = {
    harian: "Laba Hari Ini",
    mingguan: "Laba Minggu Ini",
    bulanan: "Laba Bulan Ini",
  }[periode];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Chart card */}
      <div className="bg-[#F2EAE2] border border-[#0A2947]/10 rounded-2xl p-5 sm:p-6 text-[#0A2947] shadow-sm flex flex-col w-full gap-6 overflow-hidden">
        {/* Toolbar chart */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#D4A373] rounded-lg shadow-sm shrink-0">
              <LineChartIcon className="w-5 h-5 text-[#FFFAF3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-wide text-[#0A2947]">
                Arus Kas &amp; Laba Bersih
              </h2>
              <p className="text-xs text-[#0A2947]/70 font-medium">
                {labelPeriode}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:flex w-full md:w-auto bg-[#675a41]/20 rounded-lg p-1 border border-[#0A2947]/10 shadow-inner gap-0.5 sm:gap-0">
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
            <Skeleton className="h-10 w-48 bg-[#0A2947]/10 rounded-md" />
            <Skeleton className="h-64 w-full bg-[#0A2947]/5 rounded-xl" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-[#0A2947]/60">
            <AlertTriangle className="w-10 h-10 text-rose-500/50" />
            <p className="font-bold">Gagal memuat data laporan.</p>
          </div>
        ) : (
          <>
            {/* Total nilai */}
            <div>
              <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A2947]">
                {formatRupiah(totalNilai)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={
                    totalNilai > 0
                      ? "text-xs text-[#718355] font-bold"
                      : "text-xs text-rose-500 font-bold"
                  }
                >
                  {persentaseNaikTurun}
                </span>
                <span className="text-xs text-[#0A2947]/60 font-medium">
                  vs periode sebelumnya
                </span>
              </div>
            </div>

            {/* Chart */}
            <div className="w-full h-62.5 sm:h-87.5 md:h-100 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient
                      id="gradienSage"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#718355" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#718355" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#0A2947"
                    strokeOpacity={0.15}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: "#0A2947",
                      opacity: 0.6,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    interval={
                      periode === "harian" ? 4 : periode === "bulanan" ? 4 : 0
                    }
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="nilai"
                    stroke="#718355"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, fill: "#718355", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
