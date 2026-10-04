"use client";

import { Info } from "lucide-react";

/**
 * Pengeluaran belum punya sumber data yang dapat dipakai: /bebanoperasional
 * dan /kategoribeban menjawab 403 bagi setiap pengguna di backend `50eede7`,
 * karena izinnya tidak ada di seed. Rute dan menu dipertahankan dengan
 * keterangan belum tersedia (pemilik proyek, 4 Oktober 2026).
 */
export default function PengeluaranPage() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-8 w-full">
      <div className="bg-[#F2EAE1] border border-[#0A2947]/10 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col w-full overflow-hidden">
        <h2 className="text-base sm:text-lg font-bold tracking-wide text-[#0A2947] mb-6">
          Pengeluaran
        </h2>

        <div className="rounded-2xl border border-dashed border-[#0A2947]/20 bg-[#FFFAF3] p-12 sm:p-16 text-center">
          <Info className="w-10 h-10 text-[#D4A373] mx-auto mb-4" />
          <p className="text-base font-bold text-[#0A2947] mb-1">
            Pengeluaran belum tersedia
          </p>
          <p className="text-sm font-medium text-[#0A2947]/60 max-w-md mx-auto">
            Pencatatan beban operasional akan tampil di sini setelah fitur ini
            didukung server.
          </p>
        </div>
      </div>
    </div>
  );
}
