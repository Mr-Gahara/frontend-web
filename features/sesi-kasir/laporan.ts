/**
 * Fungsi murni Laporan Tutup Kasir (PW10, B375, B376): filter dan parameter
 * daftar periode, teks baris dan judul, serta angka struk (keputusan
 * rancangan butir 10). Laporan dibentuk backend per periode, gabungan seluruh
 * sesi kasir di outlet per shift atau hari toko.
 */

import { labelPilPeriode, rentangSama, type PilFilter } from "@/lib/filter";
import { keTanggalLokal } from "@/lib/waktu";
import type { PeriodeKasir, StatusPeriodeKasir } from "@/types/sesiKasir";
import { jamLokal, rentangJam } from "./tampilan";

export const URL_LAPORAN_TUTUP_KASIR = "/dashboard/outlet/keuangan/laporanTutupKasir";
export const urlLaporanPeriode = (id: string) => `${URL_LAPORAN_TUTUP_KASIR}/${id}`;

/** Ukuran halaman daftar periode; batas limit backend 100. */
export const PILIHAN_UKURAN_PERIODE = [10, 20, 50] as const;
export const UKURAN_PERIODE_BAWAAN = 10;

export interface FilterPeriode {
  dari: Date | undefined;
  sampai: Date | undefined;
}

/** Tanpa periode bawaan: seluruh laporan, terbaru di atas. */
export const FILTER_PERIODE_KOSONG: FilterPeriode = { dari: undefined, sampai: undefined };

/**
 * Parameter GET /sesikasir/periode. Tanggal dikirim YYYY-MM-DD lokal, dibaca
 * backend sebagai awal dan akhir hari WIB atas dibukaPada.
 */
export function paramsDaftarPeriode(filter: FilterPeriode, halaman: number, ukuran: number): Record<string, string> {
  const params: Record<string, string> = { page: String(halaman), limit: String(ukuran) };
  if (filter.dari) params.dari = keTanggalLokal(filter.dari);
  if (filter.sampai) params.sampai = keTanggalLokal(filter.sampai);
  return params;
}

export function jumlahFilterPeriode(filter: FilterPeriode): number {
  return rentangSama(filter, FILTER_PERIODE_KOSONG) ? 0 : 1;
}

export function pilFilterPeriode(
  filter: FilterPeriode,
  hariIni: Date,
  terapkan: (baru: FilterPeriode) => void,
): PilFilter[] {
  if (jumlahFilterPeriode(filter) === 0) return [];
  const label = labelPilPeriode(filter, hariIni) ?? "Semua tanggal";
  return [{ kunci: "periode", label: `Dibuka ${label}`, onHapus: () => terapkan(FILTER_PERIODE_KOSONG) }];
}

export const LABEL_STATUS_PERIODE: Record<StatusPeriodeKasir, string> = {
  BUKA: "Berjalan",
  TUTUP: "Selesai",
};

const FORMAT_WAKTU_BARIS = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** "Kam 27 Nov 2026, 13.02" (papan A). */
export function waktuBaris(iso: string): string {
  return `${FORMAT_WAKTU_BARIS.format(new Date(iso)).replace(", ", " ")}, ${jamLokal(iso)}`;
}

/** "2 sesi", atau "2 sesi · 1 masih buka" selama periode berjalan. */
export function teksSesiPeriode(p: Pick<PeriodeKasir, "status" | "jumlahSesi" | "sesiBuka">): string {
  const dasar = `${p.jumlahSesi} sesi`;
  return p.status === "BUKA" && p.sesiBuka > 0 ? `${dasar} · ${p.sesiBuka} masih buka` : dasar;
}

const FORMAT_HARI_JUDUL = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "Laporan Tutup Kasir, Senin 24 November 2026", dari waktu periode dibuka. */
export function judulLaporan(dibukaPada: string): string {
  return `Laporan Tutup Kasir, ${FORMAT_HARI_JUDUL.format(new Date(dibukaPada)).replace(", ", " ")}`;
}

/**
 * "08.00 sampai 16.05 · 2 sesi kasir · Outlet Gajah Mada". Periode yang masih
 * berjalan berakhir "sekarang"; outlet hanya diketahui dari laporan.
 */
export function subjudulLaporan(
  p: Pick<PeriodeKasir, "dibukaPada" | "ditutupPada" | "jumlahSesi">,
  namaOutlet: string | null | undefined,
): string {
  const bagian = [rentangJam(p), `${p.jumlahSesi} sesi kasir`];
  if (namaOutlet) bagian.push(namaOutlet);
  return bagian.join(" · ");
}

/**
 * Angka struk tanpa "Rp", seperti struk kertas ("1.250.000", "-2.000"). Batas
 * pecahan ditulis eksplisit agar teksnya sama di setiap runtime (keputusan
 * rancangan butir 24).
 */
const FORMAT_ANGKA_STRUK = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const angkaStruk = (n: number): string => FORMAT_ANGKA_STRUK.format(n);

const FORMAT_TANGGAL_STRUK = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });

/** "24/11/2026 08.00" (Susunan struk). */
export function waktuStruk(iso: string): string {
  return `${FORMAT_TANGGAL_STRUK.format(new Date(iso))} ${jamLokal(iso)}`;
}
