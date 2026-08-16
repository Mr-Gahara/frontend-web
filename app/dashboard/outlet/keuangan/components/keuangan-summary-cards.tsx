"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import { LaporanLabaRugiData } from "@/types/laporan";
import { useMemo } from "react";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

type SummaryCard = {
  title: string;
  source: "laporan" | "kas";
  dataKey?: keyof LaporanLabaRugiData; // Kunci data yang mau dijumlahkan
};

const SUMMARY_CARDS: SummaryCard[] = [
  { title: "Total Omzet Bulan Ini", source: "laporan", dataKey: "totalOmzet" },
  {
    title: "Total Pengeluaran",
    source: "laporan",
    dataKey: "totalBebanOperasional",
  },
  { title: "Laba Bersih", source: "laporan", dataKey: "totalLabaBersih" },
  { title: "Saldo Kas Total", source: "kas" }, // Saldo Kas punya endpoint sendiri
];

function SummaryCardItem({ card }: { card: SummaryCard }) {
  // Kalkulator Absolut Bulan Ini
  const { startBulan, endBulan } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startBulan: start.toISOString(), endBulan: end.toISOString() };
  }, []);

  // 1. Tentukan Query Key berdasarkan sumber data
  const dynamicQueryKey =
    card.source === "laporan"
      ? [...queryKeys.laporanLabaRugi({ periode: "bulanan" }), startBulan, endBulan]
      : [...queryKeys.akunKas, "summary-total"];

  // 2. FETCH DATA MENTAH (Simpan Array ke Cache, bukan hasil jumlahnya)
  const { data: rawData } = useQuery({
    queryKey: dynamicQueryKey,
    queryFn: async () => {
      try {
        if (card.source === "laporan") {
          const res = await apiClient.get<any>(
            `/laporan/laba-rugi?periode=bulanan&startDate=${startBulan}&endDate=${endBulan}`,
            undefined,
            "pengguna",
          );
          return res.data?.data || res.data || [];
        } else {
          const res = await apiClient.get<any>(
            "/akunkas",
            undefined,
            "pengguna",
          );
          return res.data?.data || res.data || [];
        }
      } catch {
        return [];
      }
    },
    retry: 1,
  });

  // 3. KALKULASI DI TINGKAT KOMPONEN
  const nilai = useMemo(() => {
    if (!rawData || !Array.isArray(rawData)) return 0;

    if (card.source === "laporan") {
      return rawData.reduce(
        (sum, item) => sum + (Number(item[card.dataKey!]) || 0),
        0
      );
    } else {
      return rawData.reduce(
        (sum, item) => sum + (Number(item.saldo) || 0),
        0
      );
    }
  }, [rawData, card]);

  return (
    // Background Cream konsisten
    <div className="bg-[#F2EAE1] p-5 rounded-2xl text-[#0A2947] flex flex-col justify-between shadow-sm min-h-27.5 border border-[#0A2947]/10">
      <div className="flex justify-between items-center mb-4">
        {/* Teks title dengan sedikit transparansi */}
        <p className="text-sm font-medium text-[#0A2947]/70">{card.title}</p>

        {/* Badge menggunakan aksen Sage Green agar serasi dengan card Cream */}
        <div className="flex items-center gap-1 bg-[#718355]/10 px-2 py-1 rounded-md">
          <TrendingUp className="w-3 h-3 text-[#718355]" />
          <span className="text-xs text-[#718355] font-bold">—</span>
        </div>
      </div>

      {/* Angka dengan warna Navy pekat untuk kontras di atas Cream */}
      <h3 className="text-2xl font-black tracking-tight text-[#0A2947]">
        {nilai === 0 ? "Rp 0" : formatRupiah(nilai)}
      </h3>
    </div>
  );
}

export function KeuanganSummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {SUMMARY_CARDS.map((card) => (
        <SummaryCardItem key={card.title} card={card} />
      ))}
    </div>
  );
}
