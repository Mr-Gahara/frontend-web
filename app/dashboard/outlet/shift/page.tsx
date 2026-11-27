"use client";

import { KotakKesiapan } from "@/features/notifikasi/kotak-kesiapan";
import { HalamanShiftRuang } from "@/features/shift/halaman-shift-ruang";

export default function MasterShiftOutletPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      {/* Langkah kesiapan toko (PW18, KS13a). */}
      <KotakKesiapan langkah={["shift"]} />
      <HalamanShiftRuang ruang="outlet" />
    </div>
  );
}
