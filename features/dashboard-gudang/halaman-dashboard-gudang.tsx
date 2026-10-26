"use client";

import { useTanggalHariIni } from "@/hooks/use-hari-ini";

import { useLokasiBertipe } from "@/features/inventaris/hooks";
import { IZIN } from "@/lib/auth/permissions";
import { useSession } from "@/lib/auth/useSession";
import { panelDashboardGudang } from "./izin";
import { PanelPengajuan, PanelPengiriman } from "./panel-alur";
import { PanelJurnal } from "./panel-jurnal";
import { PanelStokKritis } from "./panel-stok-kritis";
import { formatHari } from "./tampilan";

/** Nama gudang di bawah judul; dipasang hanya bila pengguna boleh membaca lokasi. */
function NamaGudang() {
  const { lokasi } = useLokasiBertipe("Gudang");
  return lokasi?.nama ? <>{lokasi.nama} · </> : null;
}

/**
 * Dashboard gudang, desain B "Alur barang". Panel yang izinnya tidak dipegang
 * tidak dipasang (features/dashboard-gudang/izin.ts). Layout gudang baru
 * memasang halaman ini setelah sesi dimuat di klien, sehingga tanggal hari ini
 * tidak pernah dirender di server.
 */
export function HalamanDashboardGudang() {
  const { permissions } = useSession();
  const panel = panelDashboardGudang(permissions);
  // "Hari ini" berganti sendiri setelah 00.00; layar yang dibiarkan menyala
  // semalaman tidak menampilkan data kemarin (keputusan pemilik proyek,
  // 26 Oktober 2026).
  const hari = useTanggalHariIni();
  const adaAlur = panel.pengajuan || panel.pengiriman;
  const adaBawah = panel.stokKritis || panel.jurnal;
  const alurPenuh = panel.pengajuan !== panel.pengiriman ? "lg:col-span-2" : "";

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-[22px] sm:gap-7 w-full text-navy">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight">Dashboard Gudang</h1>
        <p className="text-[13px] sm:text-sm text-navy/60">
          {permissions.includes(IZIN.location) && <NamaGudang />}
          {formatHari(hari)}
        </p>
      </header>

      {!adaAlur && !adaBawah && (
        <div className="bg-krem rounded-3xl px-6 py-7 flex flex-col gap-1.5 max-w-2xl">
          <span className="text-base font-semibold">Belum ada ringkasan untuk akun Anda</span>
          <span className="text-sm text-navy/75 leading-relaxed">
            Akun Anda belum diberi akses ke pengajuan, pengiriman, stok, maupun jurnal gudang. Hubungi
            pemilik toko bila Anda memerlukannya.
          </span>
        </div>
      )}

      {adaAlur && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {panel.pengajuan && (
            <div className={alurPenuh}>
              <PanelPengajuan />
            </div>
          )}
          {panel.pengiriman && (
            <div className={alurPenuh}>
              <PanelPengiriman />
            </div>
          )}
        </div>
      )}

      {adaBawah && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-7 items-start">
          {panel.stokKritis && (
            <div className={panel.jurnal ? "lg:col-span-3" : "lg:col-span-5"}>
              <PanelStokKritis />
            </div>
          )}
          {panel.jurnal && (
            <div className={panel.stokKritis ? "lg:col-span-2" : "lg:col-span-5"}>
              <PanelJurnal />
            </div>
          )}
        </div>
      )}
    </div>
  );
}