"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

type SummaryCard = {
  title: string;
  queryKey: string[];
  endpoint: string | null;
};

const SUMMARY_CARDS: SummaryCard[] = [
  {
    title: "Total Omzet Bulan Ini",
    queryKey: ["summary", "omzet"],
    endpoint: null, // TODO: ganti dengan "/laporan/omzet-bulan-ini"
  },
  {
    title: "Total Pengeluaran",
    queryKey: ["summary", "pengeluaran"],
    endpoint: null, // TODO: ganti dengan "/laporan/pengeluaran-bulan-ini"
  },
  {
    title: "Laba Bersih",
    queryKey: ["summary", "laba"],
    endpoint: null, // TODO: ganti dengan "/laporan/laba-bersih"
  },
  {
    title: "Saldo Kas Total",
    queryKey: ["summary", "saldo"],
    endpoint: null, // TODO: ganti dengan "/laporan/saldo-kas-total"
  },
];

function SummaryCardItem({ card }: { card: SummaryCard }) {
  const { data } = useQuery({
    queryKey: card.queryKey,
    queryFn: async () => {
      if (!card.endpoint) return 0;
      try {
        const res = await apiClient.get<{ total: number }>(
          card.endpoint,
          undefined,
          "pengguna",
        );
        return res.total ?? 0;
      } catch {
        return 0;
      }
    },
    retry: card.endpoint ? 2 : false,
  });

  const nilai = data ?? 0;

  return (
    <div className="bg-[#424242] p-5 rounded-xl text-white flex flex-col justify-between shadow-sm min-h-27.5">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-medium text-zinc-300">{card.title}</p>
        <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          <span className="text-xs text-emerald-400 font-medium">—</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold tracking-tight">
        {nilai === 0 ? "Rp 0" : formatRupiah(nilai)}
      </h3>
    </div>
  );
}

export function KeuanganSummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {SUMMARY_CARDS.map((card) => (
        <SummaryCardItem key={card.queryKey.join("-")} card={card} />
      ))}
    </div>
  );
}