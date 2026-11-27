"use client";

import { useParams } from "next/navigation";
import { HalamanLaporanPeriode } from "@/features/sesi-kasir/halaman-laporan-periode";

/** Satu laporan tutup kasir per periode (GET /sesikasir/periode/:id, B375). */
export default function Page() {
  const params = useParams<{ id: string }>();
  return <HalamanLaporanPeriode id={params.id} />;
}
