/**
 * Izin per panel dashboard outlet (keputusan rancangan butir 9). Rutenya
 * tanpa syarat di IZIN_HALAMAN; panel yang izinnya tidak dipegang tidak
 * dipasang, sehingga tidak ada permintaan yang pasti dijawab 403.
 */
import { IZIN } from "@/lib/auth/permissions";

export interface PanelDashboard {
  /** Kartu omzet, laba bersih, HPP, dan grafik pendapatan. */
  laporan: boolean;
  /** Kartu transaksi lunas hari ini. */
  transaksi: boolean;
  /** Pelanggan dan sisa waktu di petak venue; petaknya sendiri tanpa izin. */
  rincianVenue: boolean;
  /** Tabel status staf: monitoring absensi per lokasi outlet (B183) dan daftar pengguna ruang outlet. */
  staf: boolean;
  /** Izin dan cuti di tabel status staf. */
  izinCuti: boolean;
}

export function panelDashboard(permissions: readonly string[]): PanelDashboard {
  const punya = (izin: string) => permissions.includes(izin);
  return {
    laporan: punya(IZIN.laporan),
    transaksi: punya(IZIN.penjualan),
    rincianVenue: punya(IZIN.booking),
    staf: punya(IZIN.absensi) && punya(IZIN.pengguna) && punya(IZIN.location),
    izinCuti: punya(IZIN.izinCuti),
  };
}