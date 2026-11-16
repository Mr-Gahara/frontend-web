import type { JamOperasional } from "@/types/tenant";

/**
 * Aturan jam buka toko untuk shift dan jadwal ruang outlet (JO1a dan JO2a,
 * pemilik proyek 16 November 2026, desain A kanvas "Jam Buka di Shift dan
 * Jadwal"). Backend hanya memakai jamOperasional untuk booking (P81), sehingga
 * aturan ini murni tampilan web dan tidak menahan simpan.
 *
 * Hari diindeks 0 sampai 6 untuk Senin sampai Minggu, sama dengan urutan
 * jamOperasional.hari.
 */

const NAMA_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as const;
const SEHARI = 1440;

/** Indeks hari Senin = 0 sampai Minggu = 6 dari tanggal lokal. */
export function indeksHari(tanggal: Date): number {
  return (tanggal.getDay() + 6) % 7;
}

/** Indeks hari yang Libur di jam buka; kosong bila belum diatur atau buka 24 jam. */
export function hariLiburToko(jam: JamOperasional | null | undefined): Set<number> {
  if (!jam || jam.mode !== "tertentu") return new Set();
  return new Set(jam.hari.flatMap((h, i) => (h.status === "libur" ? [i] : [])));
}

/** Tanggal lokal YYYY-MM-DD jatuh pada hari Libur toko. */
export function tanggalLiburToko(tanggal: string, libur: ReadonlySet<number>): boolean {
  const [th, bl, hr] = tanggal.split("-").map(Number);
  return libur.has(indeksHari(new Date(th, bl - 1, hr)));
}

const menit = (jam: string) => {
  const [j, m] = jam.split(":").map(Number);
  return j * 60 + m;
};

/** "08:00" menjadi "08.00", seperti teks jam lain di layar. */
const teksJam = (jam: string) => jam.replace(":", ".");

function gabungNama(nama: string[]): string {
  if (nama.length <= 1) return nama[0] ?? "";
  if (nama.length === 2) return `${nama[0]} dan ${nama[1]}`;
  return `${nama.slice(0, -1).join(", ")}, dan ${nama[nama.length - 1]}`;
}

/**
 * Nama sekelompok hari: hari berurutan tiga atau lebih menjadi "Senin sampai
 * Sabtu", sisanya disebut satu per satu.
 */
export function teksKelompokHari(indeks: readonly number[]): string {
  const urut = [...indeks].sort((a, b) => a - b);
  const bagian: string[] = [];
  let i = 0;
  while (i < urut.length) {
    let j = i;
    while (j + 1 < urut.length && urut[j + 1] === urut[j] + 1) j++;
    if (j - i >= 2) bagian.push(`${NAMA_HARI[urut[i]]} sampai ${NAMA_HARI[urut[j]]}`);
    else for (let k = i; k <= j; k++) bagian.push(NAMA_HARI[urut[k]]);
    i = j + 1;
  }
  return gabungNama(bagian);
}

export interface PeringatanShift {
  judul: string;
  /** Satu kalimat per kelompok hari berjam sama. */
  kalimat: string[];
  masukMelanggar: boolean;
  pulangMelanggar: boolean;
}

/**
 * Peringatan shift di luar jam buka (JO1a). Shift dibandingkan dengan setiap
 * hari Buka; hari 24 jam dan Libur tidak dihitung, dan toko 24 jam atau jam
 * yang belum diatur tidak diberi peringatan. Shift dan jam tutup yang lewat
 * tengah malam dibaca sebagai rentang yang menyambung, dan shift yang jatuh
 * di luberan malam masa buka (misalnya 00.00 sampai 02.00 pada toko yang
 * tutup 02.00) dianggap di dalam jam buka. null bila tidak ada pelanggaran
 * atau jam shift belum lengkap.
 */
export function peringatanShiftJamBuka(
  jam: JamOperasional | null | undefined,
  jamMasuk: string,
  jamPulang: string,
): PeringatanShift | null {
  if (!jam || jam.mode !== "tertentu") return null;
  if (!/^\d{2}:\d{2}$/.test(jamMasuk) || !/^\d{2}:\d{2}$/.test(jamPulang)) return null;
  const mulai = menit(jamMasuk);
  let selesai = menit(jamPulang);
  if (selesai <= mulai) selesai += SEHARI;

  const masuk = new Map<string, number[]>();
  const pulang = new Map<string, number[]>();
  jam.hari.forEach((h, i) => {
    if (h.status !== "buka") return;
    const buka = menit(h.jamBuka);
    let tutup = menit(h.jamTutup);
    if (tutup <= buka) tutup += SEHARI;
    const di = (geser: number) => mulai + geser >= buka && selesai + geser <= tutup;
    if (di(0) || di(SEHARI)) return;
    if (mulai < buka) masuk.set(h.jamBuka, [...(masuk.get(h.jamBuka) ?? []), i]);
    if (selesai > tutup) pulang.set(h.jamTutup, [...(pulang.get(h.jamTutup) ?? []), i]);
  });
  if (masuk.size === 0 && pulang.size === 0) return null;

  const kalimat = [
    ...[...masuk].map(
      ([buka, hari]) =>
        `Toko buka pukul ${teksJam(buka)} pada ${teksKelompokHari(hari)}, sedangkan shift masuk ${teksJam(jamMasuk)}.`,
    ),
    ...[...pulang].map(
      ([tutup, hari]) =>
        `Toko tutup pukul ${teksJam(tutup)} pada ${teksKelompokHari(hari)}, sedangkan shift pulang ${teksJam(jamPulang)}.`,
    ),
  ];
  const masukMelanggar = masuk.size > 0;
  const pulangMelanggar = pulang.size > 0;
  const judul =
    masukMelanggar && pulangMelanggar
      ? "Shift ini di luar jam buka toko"
      : masukMelanggar
        ? "Shift ini mulai sebelum toko buka"
        : "Shift ini melewati jam tutup toko";
  return { judul, kalimat, masukMelanggar, pulangMelanggar };
}

export const PENUTUP_PERINGATAN_SHIFT = "Shift tetap bisa disimpan.";
