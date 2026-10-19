/**
 * Izin per panel dashboard gudang (keputusan rancangan butir 9). Rutenya
 * tanpa syarat di IZIN_HALAMAN; panel yang izinnya tidak dipegang tidak
 * dipasang, sehingga tidak ada permintaan yang pasti dijawab 403.
 */
import { IZIN, bolehBukaRute } from "@/lib/auth/permissions";
import type { Tautan } from "./ringkasan";

export interface PanelDashboardGudang {
  /** Kartu pengajuan, dihitung dari GET /pengajuanstok. */
  pengajuan: boolean;
  /** Kartu surat jalan, dari GET /dashboard/gudang. */
  pengiriman: boolean;
  /** Daftar stok kritis: GET /location dan GET /inventory. */
  stokKritis: boolean;
  /** Linimasa jurnal: GET /jurnalstok. */
  jurnal: boolean;
}

export function panelDashboardGudang(permissions: readonly string[]): PanelDashboardGudang {
  const punya = (izin: string) => permissions.includes(izin);
  return {
    pengajuan: punya(IZIN.pengajuanStok),
    pengiriman: punya(IZIN.dashboardGudang),
    stokKritis: punya(IZIN.location) && (punya(IZIN.inventory) || punya(IZIN.inventoryGudang)),
    jurnal: punya(IZIN.jurnalStok),
  };
}

/** Alamat tautan bila gerbang halaman tujuannya terpenuhi; null berarti tampil tanpa tautan. */
export function urlBoleh(tautan: Tautan, permissions: readonly string[]): string | null {
  return bolehBukaRute(tautan.path, [...permissions]) ? tautan.url : null;
}