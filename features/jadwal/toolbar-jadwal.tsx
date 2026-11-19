"use client";

import React from "react";
import { KotakCari } from "@/components/filter/bilah-filter";
import { Button } from "@/components/ui/button";
import { Plus, Wand2, ChevronLeft, ChevronRight } from "lucide-react";

interface JadwalToolbarProps {
  tipeRuang: "outlet" | "gudang";
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  /** Tombol hanya tampil bila diisi; halaman mengisinya menurut izin (features/jadwal/izin.ts). */
  onAddManual?: () => void;
  onAutoGenerate?: () => void;
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-judul font-bold tracking-tight text-navy">
            Jadwal Shift {tipeRuang === "outlet" ? "Outlet" : "Gudang"}
          </h1>
          <p className="text-isi text-navy/60 font-medium">
            Kelola dan pantau jadwal kerja karyawan bulanan.
          </p>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          {onAddManual && (
            <Button
              variant="outline"
              size="aksi"
              onClick={onAddManual}
              className="min-w-0 flex-1 border-navy/20 text-navy hover:bg-navy/5 bg-transparent sm:flex-none"
            >
              <Plus className="h-4 w-4" /> Tambah Manual
            </Button>
          )}
          {onAutoGenerate && (
            <Button
              onClick={onAutoGenerate}
              size="aksi"
              className="min-w-0 flex-1 bg-navy text-gading hover:bg-navy/90 shadow-md transition-all active:scale-[0.98] sm:flex-none"
            >
              <Wand2 className="h-4 w-4" /> Auto-Generate
            </Button>
          )}
        </div>
      </div>

      {/* FILTER & NAVIGASI WAKTU */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <KotakCari
          id="cari-jadwal"
          label="Cari nama karyawan"
          placeholder="Cari nama karyawan..."
          value={searchQuery}
          onChange={onSearchChange}
        />

        <div className="flex items-center gap-2 bg-gading border border-navy/15 rounded-xl p-1 shadow-sm">
          <Button variant="ghost" size="icon" onClick={onPrevMonth} aria-label="Bulan sebelumnya" className="h-9 w-9 rounded-lg text-navy hover:bg-navy/10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center font-bold text-navy px-4 min-w-35 justify-center">
            {currentDate.toLocaleString("id-ID", { month: "long", year: "numeric" })}
          </div>
          <Button variant="ghost" size="icon" onClick={onNextMonth} aria-label="Bulan berikutnya" className="h-9 w-9 rounded-lg text-navy hover:bg-navy/10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}