"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { useLabaRugi } from "@/features/laporan/hooks";
import { jumlahkan, rentangBulanIni, type KolomNilaiLaporan } from "@/features/laporan/periode";

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
  dataKey?: KolomNilaiLaporan; // Kunci data yang mau dijumlahkan
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

/**
 * Satu kartu ringkasan. nilai null berarti sumber datanya gagal dimuat,
 * ditampilkan "-" beserta keterangan, bukan Rp0 (keputusan KU2a).
 */
function SummaryCardItem({ card, nilai }: { card: SummaryCard; nilai: number | null }) {
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
        {nilai === null ? "-" : nilai === 0 ? "Rp 0" : formatRupiah(nilai)}
      </h3>
      {nilai === null && (
        <p className="text-xs font-medium text-rose-600 mt-1">Gagal memuat data</p>
      )}
    </div>
  );
}

export function KeuanganSummaryCards() {
  // Bulan kalender penuh, dihitung sekali per pemasangan layout.
  const rentang = useMemo(() => rentangBulanIni(), []);
  const laporan = useLabaRugi(rentang);
  const akunKas = useDaftarAkunKas();

  const nilaiKartu = (card: SummaryCard): number | null => {
    if (card.source === "kas") {
      if (akunKas.isError) return null;
      return (akunKas.data ?? []).reduce((total, akun) => total + (Number(akun.saldo) || 0), 0);
    }
    if (laporan.isError || !card.dataKey) return null;
    return jumlahkan(laporan.data ?? [], card.dataKey);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
      {SUMMARY_CARDS.map((card) => (
        <SummaryCardItem key={card.title} card={card} nilai={nilaiKartu(card)} />
      ))}
    </div>
  );
}
