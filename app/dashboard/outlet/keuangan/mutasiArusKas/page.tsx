"use client";

import { Info } from "lucide-react";

/**
 * Mutasi arus kas belum punya sumber data: backend belum punya model maupun
 * route mutasi kas (kontrak/temuan.md butir 61). Tab dan rute dipertahankan
 * dengan keterangan belum tersedia, menggantikan data tiruan (keputusan KU1a).
 */
export default function MutasiArusKasPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      <div className="bg-[#F2EAE1] border border-[#0A2947]/10 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col w-full overflow-hidden">
        <h2 className="text-base sm:text-lg font-bold tracking-wide text-[#0A2947] mb-6">
          Laporan Mutasi Arus Kas
        </h2>

        <div className="rounded-2xl border border-dashed border-[#0A2947]/20 bg-[#FFFAF3] p-12 sm:p-16 text-center">
          <Info className="w-10 h-10 text-[#D4A373] mx-auto mb-4" />
          <p className="text-base font-bold text-[#0A2947] mb-1">
            Mutasi arus kas belum tersedia
          </p>
          <p className="text-sm font-medium text-[#0A2947]/60 max-w-md mx-auto">
            Riwayat uang masuk dan keluar per akun kas akan tampil di sini setelah
            fitur ini didukung server.
          </p>
        </div>
      </div>
    </div>
  );
}
