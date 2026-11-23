import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { apiClient } from "@/lib/apiClient";
import type { PilFilter } from "@/lib/filter";

/**
 * Ekspor daftar dan laporan (backend P85): berkas dibangun server lewat
 * ?format=, web hanya menyimpan Blob-nya. Daftar per bulan kalender WIB
 * (?bulan=YYYY-MM), paling banyak 10.000 baris.
 */

export type FormatDaftar = "csv" | "xlsx";
export type FormatLaporan = FormatDaftar | "pdf";

export const LABEL_FORMAT: Record<FormatLaporan, string> = { pdf: "PDF", xlsx: "Excel", csv: "CSV" };

/** Pilihan menu unduh laporan ringkasan (laba rugi, arus kas, pembayaran per metode). */
export const PILIHAN_FORMAT_LAPORAN: { format: FormatLaporan; label: string }[] = [
  { format: "pdf", label: "PDF" },
  { format: "xlsx", label: "Excel" },
  { format: "csv", label: "CSV" },
];

/** Pilihan format ekspor daftar; PDF tidak tersedia untuk daftar (P85 butir 6). */
export const PILIHAN_FORMAT_DAFTAR: { format: FormatDaftar; label: string }[] = [
  { format: "xlsx", label: "Excel" },
  { format: "csv", label: "CSV" },
];

/** Bulan kalender lokal sebagai YYYY-MM, bentuk query ?bulan= backend. */
export function keBulan(tanggal: Date): string {
  return format(tanggal, "yyyy-MM");
}

/** Tanggal 1 bulan yang digeser sebanyak `geser` bulan dari `tanggal`. */
export function geserBulan(tanggal: Date, geser: number): Date {
  return new Date(tanggal.getFullYear(), tanggal.getMonth() + geser, 1);
}

/** "November 2026". */
export function labelBulan(tanggal: Date): string {
  return format(tanggal, "MMMM yyyy", { locale: localeID });
}

/** Bulan yang belum datang tidak dapat dipilih. */
export function bulanSesudahIni(tanggal: Date, hariIni: Date): boolean {
  return keBulan(tanggal) > keBulan(hariIni);
}

/** Menyimpan berkas unduhan di perangkat pengguna. */
export function simpanBerkas(berkas: Blob, nama: string) {
  const url = URL.createObjectURL(berkas);
  const a = document.createElement("a");
  a.href = url;
  a.download = nama;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Query ekspor dari query daftar yang sedang tampil: filter yang sama, tanpa
 * page dan limit, dan tanpa batas tanggal, karena ekspor memakai ?bulan= dan
 * backend menolak keduanya bersama format (utils/eksporDaftar.js). Penjualan
 * memakai startDate/endDate, daftar lain dari/sampai.
 */
export function paramEkspor(
  params: Record<string, string>,
  kunciTanggal: readonly string[] = ["dari", "sampai"],
): Record<string, string> {
  const buang = new Set(["page", "limit", "format", "bulan", ...kunciTanggal]);
  return Object.fromEntries(Object.entries(params).filter(([k, v]) => !buang.has(k) && v !== ""));
}

/** Label filter aktif untuk dialog unduh; periode diganti bulan unduhan. */
export function labelFilterEkspor(pil: readonly PilFilter[], cari?: { label: string; nilai: string }): string[] {
  const label = pil.filter((p) => p.kunci !== "periode").map((p) => p.label);
  const teks = cari?.nilai.trim();
  return teks ? [`${cari!.label}: ${teks}`, ...label] : label;
}

/** Mengunduh berkas ekspor daftar lewat token pengguna, dengan nama cadangan bila server tidak mengirim nama. */
export function unduhDaftar(endpoint: string, params: Record<string, string>, cadangan: string) {
  return apiClient.unduh(endpoint, params, cadangan, "pengguna");
}
