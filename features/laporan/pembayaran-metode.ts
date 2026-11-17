import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { PembayaranPerMetode } from "@/types/laporan";
import { dariTanggalLokal, keTanggalLokal } from "@/lib/waktu";
import { rentangPeriode, type RentangLaporan } from "./periode";

/**
 * Laman Pembayaran per Metode (desain B, OM2a; pemilik proyek, 17 November
 * 2026). Fungsi murni agar aturan periode, porsi, dan warna dapat diuji unit.
 */

export type PilihanPeriodeMetode = "hari" | "minggu" | "bulan" | "tanggal";

export const LABEL_PILIHAN_PERIODE: Record<PilihanPeriodeMetode, string> = {
  hari: "Hari Ini",
  minggu: "Minggu Ini",
  bulan: "Bulan Ini",
  tanggal: "Pilih tanggal",
};

/** Batas rentang laporan backend (MAKS_HARI di services/laporan/laporanService.js). */
export const MAKS_HARI_LAPORAN = 366;

/** Urutan warna cincin; berulang bila metode lebih banyak. */
export const WARNA_METODE = [
  "var(--sage)",
  "var(--navy)",
  "var(--karamel)",
  "var(--pasir)",
  "var(--sage-muda)",
  "var(--cokelat-abu)",
] as const;

export const NAMA_TANPA_NAMA = "Metode tanpa nama";

function awalHari(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Banyaknya hari dari dan sampai, keduanya ikut dihitung. */
export function jumlahHari(dari: Date, sampai: Date): number {
  return Math.round((awalHari(sampai).getTime() - awalHari(dari).getTime()) / 86_400_000) + 1;
}

export type HasilRentang = { rentang: RentangLaporan; galat: null } | { rentang: null; galat: string };

/**
 * Rentang untuk pilihan periode: Hari Ini, Minggu Ini sejak Senin, dan Bulan
 * Ini sejak tanggal 1, sama dengan Ringkasan Laba/Rugi; Pilih tanggal dari
 * dan sampai, paling panjang 366 hari.
 */
export function rentangMetode(
  pilihan: PilihanPeriodeMetode,
  hariIni: Date,
  dari?: Date,
  sampai?: Date,
): HasilRentang {
  if (pilihan === "hari") return { rentang: rentangPeriode("harian", hariIni), galat: null };
  if (pilihan === "minggu") return { rentang: rentangPeriode("mingguan", hariIni), galat: null };
  if (pilihan === "bulan") return { rentang: rentangPeriode("bulanan", hariIni), galat: null };
  if (!dari || !sampai) return { rentang: null, galat: "Pilih tanggal dari dan sampai." };
  if (awalHari(dari) > awalHari(sampai)) return { rentang: null, galat: "Tanggal dari tidak boleh sesudah tanggal sampai." };
  if (jumlahHari(dari, sampai) > MAKS_HARI_LAPORAN) {
    return { rentang: null, galat: `Rentang paling panjang ${MAKS_HARI_LAPORAN} hari.` };
  }
  return {
    rentang: { periode: "bulanan", startDate: keTanggalLokal(dari), endDate: keTanggalLokal(sampai) },
    galat: null,
  };
}

/** "17 November 2026", "1–17 November 2026", "28 Oktober – 3 November 2026", atau lintas tahun penuh. */
export function teksRentang(rentang: RentangLaporan): string {
  const a = dariTanggalLokal(rentang.startDate) as Date;
  const b = dariTanggalLokal(rentang.endDate) as Date;
  const f = (d: Date, pola: string) => format(d, pola, { locale: localeID });
  if (rentang.startDate === rentang.endDate) return f(b, "d MMMM yyyy");
  if (a.getFullYear() !== b.getFullYear()) return `${f(a, "d MMMM yyyy")} – ${f(b, "d MMMM yyyy")}`;
  if (a.getMonth() !== b.getMonth()) return `${f(a, "d MMMM")} – ${f(b, "d MMMM yyyy")}`;
  return `${f(a, "d")}–${f(b, "d MMMM yyyy")}`;
}

export interface BarisMetode {
  kunci: string;
  nama: string;
  jumlah: number;
  jumlahPembayaran: number;
  /** Porsi dari total diterima, 0 sampai 100. */
  persen: number;
  warna: string;
}

export interface RingkasMetode {
  baris: BarisMetode[];
  total: number;
  jumlahPembayaran: number;
}

/** Baris per metode dengan porsi dan warna, dalam urutan dari backend. */
export function susunMetode(daftar: readonly PembayaranPerMetode[]): RingkasMetode {
  const total = daftar.reduce((s, m) => s + (m.jumlah || 0), 0);
  const jumlahPembayaran = daftar.reduce((s, m) => s + (m.jumlahPembayaran || 0), 0);
  const baris = daftar.map((m, i) => ({
    kunci: m.metodePembayaranID ?? `tanpa-id-${i}`,
    nama: m.namaMetode?.trim() || NAMA_TANPA_NAMA,
    jumlah: m.jumlah || 0,
    jumlahPembayaran: m.jumlahPembayaran || 0,
    persen: total > 0 ? ((m.jumlah || 0) / total) * 100 : 0,
    warna: WARNA_METODE[i % WARNA_METODE.length],
  }));
  return { baris, total, jumlahPembayaran };
}

const PERSEN = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** "74,3%". */
export function formatPersen(persen: number): string {
  return `${PERSEN.format(persen)}%`;
}

export interface BusurCincin {
  kunci: string;
  warna: string;
  panjang: number;
  geser: number;
}

/** Busur cincin: panjang dan geser stroke-dasharray untuk keliling tertentu. */
export function busurCincin(baris: readonly BarisMetode[], keliling: number): BusurCincin[] {
  let terpakai = 0;
  return baris.map((b) => {
    const panjang = (b.persen / 100) * keliling;
    const busur = { kunci: b.kunci, warna: b.warna, panjang, geser: -terpakai };
    terpakai += panjang;
    return busur;
  });
}
