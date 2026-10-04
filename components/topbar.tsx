"use client";
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
  const sudahHidrasi = useSudahHidrasi();
  const currentDate = sudahHidrasi
    ? new Date().toLocaleDateString("id-ID", OPSI_TANGGAL)
    : "";

  return (
    <header className="flex justify-between items-center px-8 py-5 bg-transparent z-10">
      <div className="flex items-center gap-4">
        {/* Tombol Trigger Shadcn UI */}
        <SidebarTrigger 
          className="bg-[#0A2947] text-white hover:bg-[#0A2947]/80 hover:text-white cursor-pointer transition-colors" 
        />
        
        <span className="text-base font-semibold text-gray-800">
          {currentDate}
        </span>
      </div>

      <div>
        <button
          className="flex items-center justify-center p-2.5 bg-[#0A2947] hover:bg-[#0A2947]/80 text-white rounded-lg transition-colors cursor-pointer border-none shadow-sm"
        >
          <Bell size={20} />
        </button>
      </div>
    </header>
  );
}