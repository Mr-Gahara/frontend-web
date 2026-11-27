"use client";

import { KotakKesiapan } from "@/features/notifikasi/kotak-kesiapan";
import { HalamanShiftRuang } from "@/features/shift/halaman-shift-ruang";

export default function MasterShiftGudangPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:px-4 sm:py-8">
      {/* Langkah kesiapan toko (PW20, KS15a). */}
      <KotakKesiapan langkah={["shift-gudang"]} />
      <HalamanShiftRuang ruang="gudang" />
    </div>
  );
}