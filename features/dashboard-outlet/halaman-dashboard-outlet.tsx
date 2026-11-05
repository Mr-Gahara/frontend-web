"use client";

import { useTanggalHariIni } from "@/hooks/use-hari-ini";
import { Banknote, Package, TrendingUp } from "lucide-react";

import { panelDashboard } from "./izin";
import { KartuNilaiLaporan, KartuTransaksi } from "./kartu-ringkas";
import { PanelGrafik } from "./panel-grafik";
import { PanelStaf } from "./panel-staf";
import { PanelVenue, PanelVenueBooking } from "./panel-venue";
import { BannerSetupFitur } from "./banner-setup";
import { useSession } from "@/lib/auth/useSession";
import { planMencakup } from "@/lib/auth/fitur-plan";

/**
 * Dashboard outlet. Panel yang izinnya tidak dipegang tidak dipasang
 * (features/dashboard-outlet/izin.ts); petak venue selalu tampil, karena
 * GET /aset tanpa izin di backend.
 */
export function HalamanDashboardOutlet() {
  const { permissions, plan } = useSession();
  const panel = panelDashboard(permissions);
  // Panel venue hanya untuk plan yang mencakup sesi booking (butir 5).
  const venue = planMencakup(plan, "sesi-booking");
  // Hari acuan dihitung sekali per pemasangan, agar kunci query tetap.
  // "Hari ini" berganti sendiri setelah 00.00; layar yang dibiarkan menyala
  // semalaman tidak menampilkan data kemarin (keputusan pemilik proyek,
  // 26 Oktober 2026).
  const hari = useTanggalHariIni();

  return (
    <div className="p-3 sm:p-6 flex flex-col gap-3 sm:gap-6 w-full">
      <BannerSetupFitur />
      {(panel.laporan || panel.transaksi) && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4">
          {panel.laporan && (
            <KartuNilaiLaporan
              judul="Omzet Hari Ini"
              ikon={Banknote}
              kolom="totalOmzet"
              hari={hari}
              mundur={0}
              pembanding="dari kemarin"
            />
          )}
          {panel.transaksi && <KartuTransaksi hari={hari} />}
          {panel.laporan && (
            <KartuNilaiLaporan
              judul="Laba Bersih (Kemarin)"
              ikon={TrendingUp}
              kolom="totalLabaBersih"
              hari={hari}
              mundur={1}
              pembanding="dari biasanya"
            />
          )}
          {panel.laporan && (
            <KartuNilaiLaporan
              judul="HPP (Kemarin)"
              ikon={Package}
              kolom="totalHPP"
              hari={hari}
              mundur={1}
              pembanding="dari biasanya"
            />
          )}
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-6">
        {panel.laporan && (
          <div className={`order-2 sm:order-1 ${venue ? "xl:col-span-3" : "xl:col-span-5"}`}>
            <PanelGrafik hari={hari} />
          </div>
        )}
        {venue && (
          <div className={`order-1 sm:order-2 ${panel.laporan ? "xl:col-span-2" : "xl:col-span-5"}`}>
            {panel.rincianVenue ? <PanelVenueBooking hari={hari} /> : <PanelVenue booking={[]} />}
          </div>
        )}
      </div>
      {panel.staf && <PanelStaf hari={hari} denganIzinCuti={panel.izinCuti} />}
    </div>
  );
}