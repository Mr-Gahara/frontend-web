import { notFound } from "next/navigation";
import { PratinjauJamBuka } from "@/features/setup/pratinjau-jam-buka";

/**
 * Pratinjau development langkah jam buka wizard setup dengan data contoh
 * (pemilik proyek, 7 November 2026). Tidak ada di produksi; langkahnya masuk
 * wizard final saat penyambungan ke backend. Di luar app/dashboard, sehingga
 * tidak memerlukan entri IZIN_HALAMAN (GR3a).
 */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <PratinjauJamBuka />;
}