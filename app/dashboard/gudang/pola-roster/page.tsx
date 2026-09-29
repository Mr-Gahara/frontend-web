"use client";

import { HalamanPolaRosterRuang } from "@/features/pola-roster/halaman-pola-roster-ruang";

export default function PolaRosterGudangPage() {
  return (
    <div className="py-6 px-2 sm:px-6 w-full">
      <HalamanPolaRosterRuang ruang="gudang" />
    </div>
  );
}