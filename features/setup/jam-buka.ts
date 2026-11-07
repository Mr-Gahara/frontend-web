import { keTeksWaktu, waktuLengkap, WAKTU_KOSONG, type NilaiWaktu } from "@/lib/waktu";

/**
 * Jam buka toko di wizard setup (keputusan pemilik proyek, 7 November 2026):
 * wajib memilih buka 24 jam atau jam tertentu; jam tertentu diatur per hari
 * Senin sampai Minggu dengan status Buka, 24 jam, atau Libur. Jam tutup yang
 * lebih kecil dari jam buka berarti tutup keesokan harinya, sama dengan
 * aturan jamBuka dan jamTutup tenant di backend (B206).
 *
 * Backend B206 baru menyimpan satu pasang jam untuk semua hari, tanpa status
 * per hari dan tanpa penanda 24 jam; logika ini ditulis untuk kontrak yang
 * diminta, dan penyambungannya menunggu backend.
 */

export const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;

export type StatusHari = "buka" | "24jam" | "libur";
export type ModeJamBuka = "24jam" | "tertentu";

export interface JamHari {
  status: StatusHari;
  buka: NilaiWaktu;
  tutup: NilaiWaktu;
}

export interface NilaiJamBuka {
  /** null selama pemilik toko belum memilih; tidak ada pilihan bawaan. */
  mode: ModeJamBuka | null;
  /** Tujuh hari, urut Senin sampai Minggu. */
  hari: JamHari[];
}

export const HARI_KOSONG: JamHari = { status: "buka", buka: WAKTU_KOSONG, tutup: WAKTU_KOSONG };

export const NILAI_AWAL_JAM_BUKA: NilaiJamBuka = {
  mode: null,
  hari: HARI.map(() => HARI_KOSONG),
};

const menit = (w: NilaiWaktu) => Number(w.jam) * 60 + Number(w.menit);

/** Jam tampilan "HH.mm"; string kosong bila belum lengkap. */
export function teksJam(w: NilaiWaktu): string {
  return keTeksWaktu(w).replace(":", ".");
}

/** Galat satu hari berstatus Buka, atau null bila sah. Hari 24 jam dan Libur selalu sah. */
export function masalahHari(h: JamHari): string | null {
  if (h.status !== "buka") return null;
  if (!waktuLengkap(h.buka) || !waktuLengkap(h.tutup)) return "Isi jam buka dan jam tutup.";
  if (menit(h.buka) === menit(h.tutup)) return "Jam buka dan jam tutup tidak boleh sama.";
  return null;
}

/** Galat langkah saat Simpan dan lanjut, atau null bila sah. Semua hari libur tetap sah. */
export function masalahJamBuka(n: NilaiJamBuka): string | null {
  if (n.mode === null) return "Pilih salah satu: buka 24 jam atau jam tertentu.";
  if (n.mode === "tertentu" && n.hari.some((h) => masalahHari(h) !== null)) {
    return "Masih ada hari yang jamnya belum lengkap.";
  }
  return null;
}

export type Penutupan = { jenis: "sama" | "besok"; teks: string };

/**
 * Keterangan jam tutup hari berstatus Buka yang jamnya sah: tutup di hari
 * yang sama, atau keesokan harinya beserta nama hari itu (Minggu ke Senin).
 */
export function penutupan(h: JamHari, indeks: number): Penutupan | null {
  if (h.status !== "buka" || masalahHari(h) !== null) return null;
  const tutup = teksJam(h.tutup);
  if (menit(h.tutup) < menit(h.buka)) {
    return { jenis: "besok", teks: `Tutup keesokan harinya, ${HARI[(indeks + 1) % HARI.length]} pukul ${tutup}` };
  }
  return { jenis: "sama", teks: `Tutup di hari yang sama, pukul ${tutup}` };
}

/** Ringkasan di samping nama hari. */
export function ringkasHari(h: JamHari): string {
  if (h.status === "24jam") return "Buka 24 jam";
  if (h.status === "libur") return "Libur";
  if (masalahHari(h) !== null) return "Jam belum lengkap";
  return `${teksJam(h.buka)} sampai ${teksJam(h.tutup)}`;
}

/**
 * Bagian bilah 00 sampai 24 yang terisi, dalam persen. Hari yang tutup
 * keesokan harinya terisi dari jam buka sampai ujung bilah.
 */
export function segmenHari(h: JamHari): { kiri: number; lebar: number; lewatMalam: boolean } {
  if (h.status === "24jam") return { kiri: 0, lebar: 100, lewatMalam: false };
  if (h.status === "libur" || masalahHari(h) !== null) return { kiri: 0, lebar: 0, lewatMalam: false };
  const kiri = (menit(h.buka) / 1440) * 100;
  if (menit(h.tutup) < menit(h.buka)) return { kiri, lebar: 100 - kiri, lewatMalam: true };
  return { kiri, lebar: ((menit(h.tutup) - menit(h.buka)) / 1440) * 100, lewatMalam: false };
}

/** Indeks hari pertama berstatus Buka yang jamnya sah, sumber tombol Samakan; -1 bila tidak ada. */
export function sumberSamakan(hari: readonly JamHari[]): number {
  return hari.findIndex((h) => h.status === "buka" && masalahHari(h) === null);
}

/** Tombol Samakan tampil bila ada sumber dan ada hari Buka lain yang dapat diisi. */
export function bolehSamakan(hari: readonly JamHari[]): boolean {
  const sumber = sumberSamakan(hari);
  return sumber >= 0 && hari.some((h, i) => i !== sumber && h.status === "buka");
}

/** Jam hari sumber disalin ke setiap hari lain berstatus Buka; hari 24 jam dan Libur tidak diubah. */
export function samakanSemua(hari: readonly JamHari[]): JamHari[] {
  const sumber = sumberSamakan(hari);
  if (sumber < 0) return [...hari];
  const { buka, tutup } = hari[sumber];
  return hari.map((h, i) => (i === sumber || h.status !== "buka" ? h : { ...h, buka: { ...buka }, tutup: { ...tutup } }));
}

/** Jam tertentu dengan ketujuh hari Libur: tetap boleh disimpan, dengan peringatan. */
export function semuaLibur(n: NilaiJamBuka): boolean {
  return n.mode === "tertentu" && n.hari.every((h) => h.status === "libur");
}