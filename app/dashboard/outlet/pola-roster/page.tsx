"use client";

import { HalamanPolaRosterRuang } from "@/features/pola-roster/halaman-pola-roster-ruang";

export default function PolaRosterOutletPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      <HalamanPolaRosterRuang ruang="outlet" />
    </div>
  );
}
