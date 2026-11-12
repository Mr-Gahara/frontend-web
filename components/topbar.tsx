"use client";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { useSudahHidrasi } from "@/hooks/use-sudah-hidrasi";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TombolPanduanDashboard } from "@/components/panduan/panduan-dashboard";
import { TARGET_MENU_UTAMA } from "@/components/panduan/titik-dashboard";
import { LoncengPemberitahuan } from "@/features/notifikasi/lonceng-pemberitahuan";

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

  return (
    <header className="flex justify-between items-center px-8 py-5 bg-transparent z-10">
      <div className="flex items-center gap-4">
        {/* Tombol Trigger Shadcn UI */}
        <SidebarTrigger 
          data-panduan={TARGET_MENU_UTAMA}
          className="bg-navy text-white hover:bg-navy/80 hover:text-white cursor-pointer transition-colors" 
        />
        
        <span className="text-base font-semibold text-gray-800">
          {currentDate}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <TombolPanduanDashboard />
        <LoncengPemberitahuan />
      </div>
    </header>
  );
}