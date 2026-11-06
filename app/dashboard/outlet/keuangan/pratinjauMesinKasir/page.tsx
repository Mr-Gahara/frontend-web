import { notFound } from "next/navigation";
import { PratinjauMesinKasir } from "@/features/sesi-kasir/pratinjau";

/**
 * Pratinjau development tampilan Mesin Kasir dengan data contoh (pemilik
 * proyek, 6 November 2026). Tidak ada di produksi; rute final menyusul saat
 * penyambungan ke backend.
 */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PratinjauMesinKasir />;
}