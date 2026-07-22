"use client";

import React, { useState, useMemo } from "react";
import { Download, LineChart as LineChartIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { Button } from "@/components/ui/button";

// Types
type FilterPeriode = "harian" | "mingguan" | "bulanan";

type DataPoint = {
  label: string;
  nilai: number;
};

// Dummy data statis
const DUMMY_HARIAN: DataPoint[] = Array.from({ length: 25 }, (_, i) => ({
  label: i < 24 ? `${String(i).padStart(2, "0")}:00` : "23:59",
  nilai: [
    4200000, 3800000, 3100000, 2900000, 2600000, 2400000, 3200000, 5100000,
    6800000, 7200000, 6500000, 5900000, 6100000, 5800000, 6300000, 7100000,
    7800000, 8200000, 7600000, 6900000, 6200000, 5800000, 5100000, 4600000,
    4400000,
  ][i],
}));

const DUMMY_MINGGUAN: DataPoint[] = [
  { label: "Sen", nilai: 12500000 },
  { label: "Sel", nilai: 9800000 },
  { label: "Rab", nilai: 14200000 },
  { label: "Kam", nilai: 11600000 },
  { label: "Jum", nilai: 16800000 },
  { label: "Sab", nilai: 19200000 },
  { label: "Min", nilai: 8900000 },
];

const DUMMY_BULANAN: DataPoint[] = Array.from({ length: 30 }, (_, i) => ({
  label: String(i + 1),
  nilai: [
    8200000, 7600000, 9100000, 10200000, 8800000, 11500000, 9600000, 12100000,
    10800000, 9200000, 11800000, 13200000, 10500000, 9800000, 11200000,
    12800000, 14100000, 11600000, 10200000, 12500000, 13800000, 11200000,
    9600000, 10800000, 12100000, 14500000, 13200000, 11800000, 10500000,
    12800000,
  ][i],
}));

// Helper
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
      // Padding diperkecil (px-1), ukuran teks responsif ekstrem (10px untuk HP terkecil), dan truncate
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

// Page
export default function RingkasanLabaRugiPage() {
  const [periode, setPeriode] = useState<FilterPeriode>("bulanan");

  const data = useMemo(() => {
    if (periode === "harian") return DUMMY_HARIAN;
    if (periode === "mingguan") return DUMMY_MINGGUAN;
    return DUMMY_BULANAN;
  }, [periode]);

  const totalNilai = useMemo(
    () => data.reduce((acc, d) => acc + d.nilai, 0),
    [data]
  );

  const labelPeriode = {
    harian: "Hari Ini",
    mingguan: "Minggu Ini",
    bulanan: "Bulan Ini",
  }[periode];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Chart card */}
      <div className="bg-[#F2EAE2] border border-[#0A2947]/10 rounded-2xl p-5 sm:p-6 text-[#0A2947] shadow-sm flex flex-col w-full gap-6 overflow-hidden">
        
        {/* Toolbar chart */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Kotak Cream dengan Ikon Mustard */}
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

          {/* Filter periode: Dibuat w-full & grid di mobile agar tombol berjejer rata tanpa tumpah */}
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

        {/* Total nilai */}
        <div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A2947]">
            {formatRupiah(totalNilai)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-[#718355] font-bold">↑ 22.41%</span>
            <span className="text-xs text-[#0A2947]/60 font-medium">
              vs periode sebelumnya
            </span>
          </div>
        </div>

        {/* Chart */}
        {/* Tinggi disetel dinamis: 250px di HP, 350px/400px di layar lebar */}
        <div className="w-full h-62.5 sm:h-87.5 md:h-100 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              // Margin bawah ditambah agar teks XAxis (tanggal) tidak terpotong
              margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="gradienSage" x1="0" y1="0" x2="0" y2="1">
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
                tickMargin={12} // Memberikan jarak antara garis bawah dan label teks
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
      </div>
    </div>
  );
}