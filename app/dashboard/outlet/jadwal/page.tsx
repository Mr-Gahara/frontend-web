"use client";

import { HalamanJadwalRuang } from "@/features/jadwal/halaman-jadwal-ruang";

export default function JadwalOutletPage() {
  return (
    <div className="py-6 px-2 sm:px-6 w-full">
      <HalamanJadwalRuang ruang="outlet" />
    </div>
  );
}