"use client";

import { useState } from "react";
import { Banknote, Package, TrendingUp } from "lucide-react";

import { panelDashboard } from "./izin";
import { KartuNilaiLaporan, KartuTransaksi } from "./kartu-ringkas";
import { PanelGrafik } from "./panel-grafik";
import { PanelStaf } from "./panel-staf";
import { PanelVenue, PanelVenueBooking } from "./panel-venue";
import { useSession } from "@/lib/auth/useSession";

/**
 * Dashboard outlet. Panel yang izinnya tidak dipegang tidak dipasang
 * (features/dashboard-outlet/izin.ts); petak venue selalu tampil, karena
 * GET /aset tanpa izin di backend.
 */
export function HalamanDashboardOutlet() {
  const { permissions } = useSession();
  const panel = panelDashboard(permissions);
  // Hari acuan dihitung sekali per pemasangan, agar kunci query tetap.
  const [hari] = useState(() => new Date());

  return (
    <div className="p-3 sm:p-6 flex flex-col gap-3 sm:gap-6 w-full">
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
          <div className="order-2 sm:order-1 xl:col-span-3">
            <PanelGrafik hari={hari} />
          </div>
        )}
        <div className={`order-1 sm:order-2 ${panel.laporan ? "xl:col-span-2" : "xl:col-span-5"}`}>
          {panel.rincianVenue ? <PanelVenueBooking hari={hari} /> : <PanelVenue booking={[]} />}
        </div>
      </div>
      {panel.staf && <PanelStaf hari={hari} denganIzinCuti={panel.izinCuti} />}
    </div>
  );
}