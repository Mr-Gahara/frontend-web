"use client";

import {
  CartesianGrid,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatRupiah } from "@/lib/format";
import { WARNA } from "@/lib/warna";

/** Satu titik grafik laporan: label sumbu X dan nilainya dalam rupiah. */
export type TitikGrafik = {
  label: string;
  nilai: number;
};

/**
 * Props yang dibaca dari recharts. value diketik unknown karena recharts
 * mengizinkan angka, teks, atau array; yang ditampilkan selalu angka rupiah.
 */
type PropsTooltip = {
  active?: boolean;
  payload?: { value?: unknown }[];
  label?: string | number;
};

function TooltipGrafik({ active, payload, label }: PropsTooltip) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gading border border-navy/10 rounded-lg px-3 py-2 text-navy text-kecil shadow-lg">
      <p className="text-navy/70 font-medium mb-1">{label}</p>
      <p className="font-bold text-sage">
        {formatRupiah(Number(payload[0].value) || 0)}
      </p>
    </div>
  );
}

/**
 * Grafik garis laporan, dipakai halaman ringkasan laba rugi dan dashboard
 * outlet. Mengisi lebar dan tinggi pembungkusnya; tinggi ditentukan pemakai.
 * interval adalah jarak label sumbu X (0 berarti setiap titik berlabel).
 */
export function GrafikLaporan({
  data,
  interval,
}: {
  data: TitikGrafik[];
  interval: number;
}) {
  return (
    // initialDimension bawaan recharts 3 adalah -1 x -1, sehingga render
    // pertama sebelum wadah terukur memicu peringatan ukuran di konsol.
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
      >
        <defs>
          <linearGradient id="gradienSage" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={WARNA.sage} stopOpacity={0.4} />
            <stop offset="95%" stopColor={WARNA.sage} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={WARNA.navy}
          strokeOpacity={0.15}
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{
            fill: WARNA.navy,
            opacity: 0.6,
            fontSize: 10,
            fontWeight: 600,
          }}
          axisLine={false}
          tickLine={false}
          tickMargin={12}
          interval={interval}
        />
        <YAxis hide />
        <Tooltip content={<TooltipGrafik />} />
        <Area
          type="monotone"
          dataKey="nilai"
          stroke={WARNA.sage}
          strokeWidth={3}
          fill="url(#gradienSage)"
          dot={false}
          activeDot={{ r: 5, fill: WARNA.sage, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}