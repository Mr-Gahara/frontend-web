"use client";
import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { useSudahHidrasi } from "@/hooks/use-sudah-hidrasi";
import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

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
          className="bg-navy text-white hover:bg-navy/80 hover:text-white cursor-pointer transition-colors" 
        />
        
        <span className="text-base font-semibold text-gray-800">
          {currentDate}
        </span>
      </div>

      <div>
        <button
          type="button"
          disabled
          aria-label="Notifikasi belum tersedia"
          title="Notifikasi belum tersedia"
          className="flex items-center justify-center p-2.5 bg-navy text-white rounded-lg border-none shadow-sm opacity-50 cursor-not-allowed"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}