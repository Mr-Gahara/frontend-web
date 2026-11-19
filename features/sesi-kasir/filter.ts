/**
 * Filter riwayat buka-tutup kasir: nilai awal, parameter server, dan teks
 * rentang. Seluruh filter diterapkan backend bersama paginasi (keputusan
 * rancangan butir 27).
 */

import { labelPilPeriode, rentangSama, type PilFilter } from "@/lib/filter";
import { keTanggalLokal } from "@/lib/waktu";

/** Nilai pilihan "Semua mesin kasir" di filter riwayat. */
export const SEMUA_MESIN = "semua";

export interface NilaiFilterRiwayat {
  mesin: string;
  dari: Date | undefined;
  sampai: Date | undefined;
}

/** Riwayat dimuat 20 sesi per halaman, lewat Muat lebih banyak. */
export const UKURAN_HALAMAN_RIWAYAT = 20;

/** Batas limit backend (LIMIT_MAKS di utils/paginasi.js), untuk kasir yang buka. */
export const BATAS_KASIR_BUKA = 100;

/**
 * Tujuh hari terakhir sampai hari ini, seperti pratinjau yang disetujui.
 * Tidak ikut bergeser lewat tengah malam karena tanggalnya terlihat dan ada
 * Reset Filter (keputusan rancangan butir 28).
 */
export function filterAwalRiwayat(sekarang: Date): NilaiFilterRiwayat {
  const dari = new Date(sekarang);
  dari.setDate(dari.getDate() - 6);
  return { mesin: SEMUA_MESIN, dari, sampai: new Date(sekarang) };
}

/**
 * Parameter GET /sesikasir untuk riwayat: sesi yang sudah ditutup saja,
 * karena sesi yang masih buka tampil di kartu atas (MK2). Tanggal dikirim
 * YYYY-MM-DD lokal, yang dibaca backend sebagai awal dan akhir hari WIB
 * (bacaTanggal di utils/periodeWIB.js).
 */
export function paramsRiwayat(nilai: NilaiFilterRiwayat): Record<string, string> {
  const params: Record<string, string> = { status: "TUTUP" };
  if (nilai.mesin !== SEMUA_MESIN) params.installationId = nilai.mesin;
  if (nilai.dari) params.dari = keTanggalLokal(nilai.dari);
  if (nilai.sampai) params.sampai = keTanggalLokal(nilai.sampai);
  return params;
}

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Rentang untuk keadaan riwayat kosong: "1 Nov 2026 sampai 7 Nov 2026". */
export function teksRentangRiwayat(nilai: NilaiFilterRiwayat): string {
  if (nilai.dari && nilai.sampai) {
    return `${FORMAT_TANGGAL.format(nilai.dari)} sampai ${FORMAT_TANGGAL.format(nilai.sampai)}`;
  }
  return "rentang ini";
}

function periodeRiwayatDiubah(nilai: NilaiFilterRiwayat, bawaan: NilaiFilterRiwayat): boolean {
  return !rentangSama({ dari: nilai.dari, sampai: nilai.sampai }, { dari: bawaan.dari, sampai: bawaan.sampai });
}

/** Jumlah filter aktif; periode bawaan tujuh hari tidak dihitung (FL11a). */
export function jumlahFilterRiwayat(nilai: NilaiFilterRiwayat, bawaan: NilaiFilterRiwayat): number {
  return (nilai.mesin !== SEMUA_MESIN ? 1 : 0) + (periodeRiwayatDiubah(nilai, bawaan) ? 1 : 0);
}

export function pilFilterRiwayat(
  nilai: NilaiFilterRiwayat,
  bawaan: NilaiFilterRiwayat,
  namaMesin: (installationId: string) => string | undefined,
  hariIni: Date,
  terapkan: (baru: NilaiFilterRiwayat) => void,
): PilFilter[] {
  const pil: PilFilter[] = [];
  if (nilai.mesin !== SEMUA_MESIN) {
    pil.push({ kunci: "mesin", label: `Mesin: ${namaMesin(nilai.mesin) ?? "terpilih"}`, onHapus: () => terapkan({ ...nilai, mesin: SEMUA_MESIN }) });
  }
  if (periodeRiwayatDiubah(nilai, bawaan)) {
    const label = labelPilPeriode({ dari: nilai.dari, sampai: nilai.sampai }, hariIni) ?? "Semua tanggal";
    pil.push({ kunci: "periode", label, onHapus: () => terapkan({ ...nilai, dari: bawaan.dari, sampai: bawaan.sampai }) });
  }
  return pil;
}
