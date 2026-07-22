"use client";

import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { Button } from "@/components/ui/button";
import { Filter, Plus } from "lucide-react";
import { ReservasiNavTabs } from "./components/reservasi-nav-tabs";

export default function ReservasiLayout({ children }: { children: React.ReactNode }) {
  useAuthGuard();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8">
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#0A2947]">
            Manajemen Booking
          </h1>
          <p className="text-sm font-medium text-[#0A2947]/60">
            Kelola jadwal, sewa aset, dan pemantauan sesi aktif secara real-time.
          </p>
        </div>

        {/* TOMBOL AKSI KANAN ATAS */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="cursor-pointer border-[#0A2947]/20 bg-[#FFFAF3] text-[#0A2947] hover:bg-[#0A2947]/5 font-bold shadow-sm h-11 px-4"
            onClick={() => {
              // Logika buka modal filter aset
            }}
          >
            <Filter className="w-4 h-4 mr-2 text-[#D4A373]" /> Filter Aset
          </Button>

          <Button
            className="cursor-pointer bg-[#0A2947] text-[#FFFAF3] hover:bg-[#0A2947]/90 font-bold shadow-sm h-11 px-5"
            onClick={() => {
              // Logika buka modal / halaman buat reservasi baru
            }}
          >
            <Plus className="w-4 h-4 mr-2 text-[#D4A373]" /> Buat Reservasi Baru
          </Button>
        </div>
      </div>

      {/* NAVIGASI 4 TAB */}
      <ReservasiNavTabs />

      {/* KONTEN DINAMIS PER TAB */}
      <div className="w-full">{children}</div>
    </div>
  );
}