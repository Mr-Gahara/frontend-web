"use client";

import { HalamanShiftRuang } from "@/features/shift/halaman-shift-ruang";

export default function MasterShiftGudangPage() {
  return (
    <div className="py-6 px-2 sm:px-6 w-full">
      <HalamanShiftRuang ruang="gudang" />
    </div>
  );
}