import React from "react";
import { KeuanganSummaryCards } from "./components/keuangan-summary-cards";

export default function KeuanganLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sm:p-6 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <h1 className="text-2xl font-semibold text-zinc-900">Manajemen Keuangan</h1>
      </div>

      {/* Summary cards */}
      <KeuanganSummaryCards />

      {/* Laman Keuangan dibuka dari sub-menu Keuangan dan Laporan di sidebar
          (components/sidebar-menu.ts); tab di sini dibuang 12 November 2026. */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}