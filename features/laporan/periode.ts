import type { LaporanLabaRugiData } from "@/types/laporan";

/** Periode yang diterima GET /laporan/laba-rugi (laporanController). */
export type PeriodeLaporan = "harian" | "mingguan" | "bulanan";

/**
 * Filter laba rugi. Rentang dikirim sebagai ISO dan ikut menjadi kunci cache,
 * sehingga periode berjalan dan periode pembandingnya tersimpan terpisah.
 */
export interface RentangLaporan {
  periode: PeriodeLaporan;
  startDate: string;
  endDate: string;
}

/** Kolom angka pada setiap baris laba rugi. */
export type KolomNilaiLaporan = Exclude<keyof LaporanLabaRugiData, "tanggal">;

function awalHari(d: Date): Date {
  const hasil = new Date(d);
  hasil.setHours(0, 0, 0, 0);
  return hasil;
}

function akhirHari(d: Date): Date {
  const hasil = new Date(d);
  hasil.setHours(23, 59, 59, 999);
  return hasil;
}

/**
 * Rentang periode berjalan sampai akhir hari ini, sama dengan halaman lama:
 * harian hari ini, mingguan sejak Senin, bulanan sejak tanggal 1.
 */
export function rentangPeriode(periode: PeriodeLaporan, sekarang: Date = new Date()): RentangLaporan {
  let awal = awalHari(sekarang);
  if (periode === "mingguan") {
    const hariKe = sekarang.getDay() === 0 ? 7 : sekarang.getDay();
    awal.setDate(awal.getDate() - hariKe + 1);
  } else if (periode === "bulanan") {
    awal = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
  }
  return { periode, startDate: awal.toISOString(), endDate: akhirHari(sekarang).toISOString() };
}

/**
 * Titik yang sama satu periode sebelumnya: kemarin, tujuh hari lalu, atau
 * tanggal yang sama bulan lalu, dipangkas ke akhir bulan bila bulan lalu
 * lebih pendek.
 */
function satuPeriodeLalu(periode: PeriodeLaporan, sekarang: Date): Date {
  const hasil = new Date(sekarang);
  if (periode === "harian") {
    hasil.setDate(hasil.getDate() - 1);
  } else if (periode === "mingguan") {
    hasil.setDate(hasil.getDate() - 7);
  } else {
    const tanggal = hasil.getDate();
    hasil.setDate(1);
    hasil.setMonth(hasil.getMonth() - 1);
    const hariTerakhir = new Date(hasil.getFullYear(), hasil.getMonth() + 1, 0).getDate();
    hasil.setDate(Math.min(tanggal, hariTerakhir));
  }
  return hasil;
}

/**
 * Rentang pembanding persentase pertumbuhan (keputusan KU5a): periode yang
 * sama mundur satu periode, sepanjang yang sudah berjalan, agar periode yang
 * baru berjalan sebagian tidak dibandingkan dengan periode penuh.
 */
export function rentangPeriodeSebelumnya(
  periode: PeriodeLaporan,
  sekarang: Date = new Date(),
): RentangLaporan {
  return rentangPeriode(periode, satuPeriodeLalu(periode, sekarang));
}

/** Bulan kalender penuh, dipakai kartu ringkasan di layout keuangan. */
export function rentangBulanIni(sekarang: Date = new Date()): RentangLaporan {
  const awal = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
  const akhir = new Date(sekarang.getFullYear(), sekarang.getMonth() + 1, 0, 23, 59, 59, 999);
  return { periode: "bulanan", startDate: awal.toISOString(), endDate: akhir.toISOString() };
}

/** Jumlah satu kolom di seluruh baris; nilai yang bukan angka dihitung 0, seperti halaman lama. */
export function jumlahkan(daftar: LaporanLabaRugiData[], kolom: KolomNilaiLaporan): number {
  return daftar.reduce((total, baris) => total + (Number(baris[kolom]) || 0), 0);
}

/**
 * Persentase perubahan terhadap periode sebelumnya, atau null bila periode
 * sebelumnya 0 sehingga tidak ada pembanding (ditampilkan "-", KU5a).
 * Penyebut memakai nilai mutlak agar rugi yang membaik tetap bertanda positif.
 */
export function persentasePertumbuhan(nilaiSekarang: number, nilaiSebelumnya: number): number | null {
  if (nilaiSebelumnya === 0) return null;
  return ((nilaiSekarang - nilaiSebelumnya) / Math.abs(nilaiSebelumnya)) * 100;
}

/**
 * Teks badge pertumbuhan: panah naik atau turun dengan dua desimal, "0%"
 * bila tidak berubah, dan "-" bila tidak ada pembanding (KU5a).
 */
export function teksPertumbuhan(persen: number | null): string {
  if (persen === null) return "-";
  if (persen === 0) return "0%";
  return `${persen > 0 ? "↑" : "↓"} ${Math.abs(persen).toFixed(2)}%`;
}