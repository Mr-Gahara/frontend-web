"use client";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { useSudahHidrasi } from "@/hooks/use-sudah-hidrasi";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TombolPanduanDashboard } from "@/components/panduan/panduan-dashboard";
import { TARGET_MENU_UTAMA } from "@/components/panduan/titik-dashboard";
import { LoncengPemberitahuan } from "@/features/notifikasi/lonceng-pemberitahuan";

/** Bentuk singkat di bawah 640 px agar tanggal tidak turun dua baris (TT1a). */
const OPSI_TANGGAL_SINGKAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
};

const OPSI_TANGGAL: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
};

export default function Topbar() {
  // Tanggal dihitung setelah hidrasi, karena jam server dapat berbeda dari
  // jam browser; sebelum itu teksnya kosong, sama dengan render server.
  // Hari ini berganti sendiri setelah 00.00 (keputusan rancangan butir 28),
  // karena dashboard sering dibiarkan terbuka melewati tengah malam.
  const sudahHidrasi = useSudahHidrasi();
  const hariIni = useTanggalHariIni();
  const currentDate = sudahHidrasi
    ? hariIni.toLocaleDateString("id-ID", OPSI_TANGGAL)
    : "";
  const tanggalSingkat = sudahHidrasi
    ? hariIni.toLocaleDateString("id-ID", OPSI_TANGGAL_SINGKAT)
    : "";

  // Padding samping sama dengan area gulir dashboard (p-4 sm:p-6 md:p-8),
  // agar tombol sidebar segaris dengan tepi isi.
  return (
    <header className="flex justify-between items-center gap-3 px-4 sm:px-6 md:px-8 py-5 bg-transparent z-10">
      <div className="flex items-center gap-4">
        {/* Tombol Trigger Shadcn UI */}
        <SidebarTrigger 
          data-panduan={TARGET_MENU_UTAMA}
          className="bg-navy text-white hover:bg-navy/80 hover:text-white cursor-pointer transition-colors" 
        />
        
        <span className="text-besar font-semibold text-gray-800">
          <span className="sm:hidden">{tanggalSingkat}</span>
          <span className="hidden sm:inline">{currentDate}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <TombolPanduanDashboard />
        <LoncengPemberitahuan />
      </div>
    </header>
  );
}