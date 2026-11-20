import React from "react";
import { KeuanganSummaryCards } from "./components/keuangan-summary-cards";

export default function KeuanganLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:px-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <h1 className="text-judul font-bold tracking-tight text-navy">Manajemen Keuangan</h1>
      </div>

      {/* Summary cards */}
      <KeuanganSummaryCards />

      {/* Laman Keuangan dibuka dari sub-menu Keuangan dan Laporan di sidebar
          (components/sidebar-menu.ts); tab di sini dibuang 12 November 2026. */}
      {/* TH1a: halaman di dalam layout modul tidak menambah padding pembungkus sendiri, agar tepinya segaris dengan judul modul. */}
      <div className="w-full sm:*:px-0! sm:*:py-0!">
        {children}
      </div>
    </div>
  );
}