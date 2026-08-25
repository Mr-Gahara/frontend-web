"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Wand2, ChevronLeft, ChevronRight } from "lucide-react";

interface JadwalToolbarProps {
  tipeRuang: "outlet" | "gudang";
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onAddManual: () => void;
  onAutoGenerate: () => void;
}

export function JadwalToolbar({
  tipeRuang,
  currentDate,
  onPrevMonth,
  onNextMonth,
  searchQuery,
  onSearchChange,
  onAddManual,
  onAutoGenerate,
}: JadwalToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* HEADER & BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-[#041E3F]">
            Jadwal Shift {tipeRuang === "outlet" ? "Outlet" : "Gudang"}
          </h1>
          <p className="text-sm text-[#041E3F]/60 font-medium">
            Kelola dan pantau jadwal kerja karyawan bulanan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onAddManual}
            className="h-11 border-[#041E3F]/20 text-[#041E3F] hover:bg-[#041E3F]/5 bg-transparent font-bold rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Manual
          </Button>
          <Button
            onClick={onAutoGenerate}
            className="h-11 bg-[#041E3F] text-[#FFFAF3] hover:bg-[#041E3F]/90 font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
          >
            <Wand2 className="mr-2 h-4 w-4" /> Auto-Generate
          </Button>
        </div>
      </div>

      {/* FILTER & NAVIGASI WAKTU */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#041E3F]/40" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama karyawan..."
            className="pl-9 h-11 bg-[#FFFAF3] border-[#041E3F]/15 text-[#041E3F] focus-visible:ring-[#041E3F]/50 rounded-xl font-medium"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#FFFAF3] border border-[#041E3F]/15 rounded-xl p-1 shadow-sm">
          <Button variant="ghost" size="icon" onClick={onPrevMonth} className="h-9 w-9 rounded-lg text-[#041E3F] hover:bg-[#041E3F]/10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center font-bold text-[#041E3F] px-4 min-w-35 justify-center">
            {currentDate.toLocaleString("id-ID", { month: "long", year: "numeric" })}
          </div>
          <Button variant="ghost" size="icon" onClick={onNextMonth} className="h-9 w-9 rounded-lg text-[#041E3F] hover:bg-[#041E3F]/10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}