"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { useDaftarAkunKas } from "@/features/akun-kas/hooks";
import { useLabaRugi } from "@/features/laporan/hooks";
import { jumlahkan, rentangBulanIni, type KolomNilaiLaporan } from "@/features/laporan/periode";
import { formatRupiah } from "@/lib/format";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";

type SummaryCard = {
  title: string;
  /** Judul ringkas untuk kartu dua kolom di HP. */
  judulPendek: string;
  source: "laporan" | "kas";
  dataKey?: KolomNilaiLaporan; // Kunci data yang mau dijumlahkan
};

const SUMMARY_CARDS: SummaryCard[] = [
  {
    title: "Total Omzet Bulan Ini",
    judulPendek: "Omzet bulan ini",
    source: "laporan",
    dataKey: "totalOmzet",
  },
  {
    title: "Total Pengeluaran",
    judulPendek: "Pengeluaran",
    source: "laporan",
    dataKey: "totalBebanOperasional",
  },
  {
    title: "Laba Bersih",
    judulPendek: "Laba bersih",
    source: "laporan",
    dataKey: "totalLabaBersih",
  },
  // Saldo Kas punya endpoint sendiri
  { title: "Saldo Kas Total", judulPendek: "Saldo kas total", source: "kas" },
];

/**
 * Satu kartu ringkasan. nilai null berarti sumber datanya gagal dimuat,
 * ditampilkan "-" beserta keterangan, bukan Rp0 (keputusan KU2a).
 */
function SummaryCardItem({ card, nilai }: { card: SummaryCard; nilai: number | null }) {
  return (
    // Background Cream konsisten
    <div className="bg-krem p-3.5 sm:p-5 rounded-2xl text-navy flex flex-col justify-between shadow-sm sm:min-h-27.5 border border-navy/10 min-w-0">
      <div className="flex justify-between items-center mb-1.5 sm:mb-4">
        {/* Teks title dengan sedikit transparansi */}
        <p className="text-[13px] sm:text-sm font-medium text-navy/70">
          <span className="sm:hidden">{card.judulPendek}</span>
          <span className="hidden sm:inline">{card.title}</span>
        </p>

        {/* Badge menggunakan aksen Sage Green agar serasi dengan card Cream */}
        <div className="hidden sm:flex items-center gap-1 bg-sage/10 px-2 py-1 rounded-md">
          <TrendingUp className="w-3 h-3 text-sage" />
          <span className="text-xs text-sage font-bold">—</span>
        </div>
      </div>

      {/* Angka dengan warna Navy pekat untuk kontras di atas Cream */}
      <h3 className="text-[17px] sm:text-2xl font-black tracking-tight text-navy">
        {nilai === null ? "-" : nilai === 0 ? "Rp 0" : formatRupiah(nilai)}
      </h3>
      {nilai === null && (
        <p className="text-xs font-medium text-rose-600 mt-1">Gagal memuat data</p>
      )}
    </div>
  );
}

export function KeuanganSummaryCards() {
  // Bulan kalender penuh; ikut berganti saat bulan berganti, karena layout
  // keuangan dapat terbuka melewati tengah malam (useTanggalHariIni).
  const hariIni = useTanggalHariIni();
  const rentang = useMemo(() => rentangBulanIni(hariIni), [hariIni]);
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
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-4 w-full">
      {SUMMARY_CARDS.map((card) => (
        <SummaryCardItem key={card.title} card={card} nilai={nilaiKartu(card)} />
      ))}
    </div>
  );
}
