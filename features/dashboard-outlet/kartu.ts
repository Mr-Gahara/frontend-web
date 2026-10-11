/**
 * Aturan murni kartu dan grafik dashboard outlet (keputusan DB1a, DB2a,
 * dan DB5a).
 */
import { akhirHari, awalHari } from "@/features/akun-kas/mutasi";
import type { TitikGrafik } from "@/features/laporan/grafik-laporan";
import type { LaporanLabaRugiData } from "@/types/laporan";

/** Hari yang sama mundur sekian hari: 1 untuk kemarin, 2 untuk kemarin lusa. */
export function hariMundur(sekarang: Date, jumlahHari: number): Date {
  const hasil = new Date(sekarang);
  hasil.setDate(hasil.getDate() - jumlahHari);
  return hasil;
}

/**
 * Query GET /penjualan untuk menghitung transaksi lunas pada satu hari
 * (DB1a); jumlahnya dibaca dari pagination.total. Batas hari dikirim sebagai
 * ISO utuh dari awal dan akhir hari lokal, karena startDate bertanggal saja
 * dibaca backend sebagai tengah malam UTC (penjualanService._filterDatabase).
 */
export function paramTransaksiLunas(hari: Date): Record<string, string> {
  return {
    statusPenjualan: "PAID",
    startDate: awalHari(hari).toISOString(),
    endDate: akhirHari(hari).toISOString(),
    page: "1",
    limit: "10",
  };
}

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "2026-10-06" menjadi "6 Okt"; teks lain dikembalikan apa adanya, dan kosong menjadi "-". */
export function labelTanggalPendek(tanggal: string | null | undefined): string {
  const cocok = /^\d{4}-(\d{2})-(\d{2})/.exec(tanggal ?? "");
  const bulan = cocok ? BULAN_PENDEK[Number(cocok[1]) - 1] : undefined;
  return cocok && bulan ? `${Number(cocok[2])} ${bulan}` : tanggal || "-";
}

/** Titik grafik pendapatan: omzet per baris laporan (DB5a). */
export function titikOmzet(laporan: LaporanLabaRugiData[]): TitikGrafik[] {
  return laporan.map((baris) => ({
    label: labelTanggalPendek(baris.tanggal),
    nilai: Number(baris.totalOmzet) || 0,
  }));
}