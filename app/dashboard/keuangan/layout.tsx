import React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KeuanganSummaryCards } from "./components/keuangan-summary-cards";
import { KeuanganNavTabs } from "./components/keuangan-nav-tabs";

export default function KeuanganLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <h1 className="text-2xl font-semibold text-zinc-900">Manajemen Keuangan</h1>
      </div>

      {/* Summary cards */}
      <KeuanganSummaryCards />

      {/* Navigasi tab keuangan */}
      <KeuanganNavTabs />

      {/* Konten tiap tab akan di-render di sini */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}