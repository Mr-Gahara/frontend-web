/**
 * Aturan tur sorotan (keputusan pemilik proyek, 7 November 2026;
 * modul/setup-akun.md): tur tampil sendiri saat sebuah layar pertama kali
 * dibuka di perangkat ini, dan dapat dibuka ulang lewat tombol Lihat panduan.
 * Catatan "sudah dilihat" disimpan di localStorage perangkat, bukan di
 * server, sehingga perangkat baru menampilkan tur lagi.
 *
 * Saklar SAKLAR_OTOMATIS hanya untuk lingkungan uji: spec e2e mengisinya
 * lewat storageState agar tur tidak menutup layar spec lain. Pengguna nyata
 * tidak pernah memilikinya, dan tombol Lihat panduan tetap berfungsi.
 */

export interface TitikPanduan {
  /** Nilai atribut data-panduan pada elemen yang disorot. */
  target: string;
  judul: string;
  /** Kosong bila judulnya sudah cukup, misalnya titik tombol lanjut. */
  isi?: string;
  /** Sisi balon terhadap elemen; bawaan di bawah. */
  sisi?: "top" | "bottom" | "left" | "right";
}

export const AWALAN_KUNCI = "tachyon.panduan.v1.";
export const SAKLAR_OTOMATIS = "tachyon.panduan.otomatis";
export const NILAI_SAKLAR_MATI = "mati";
const NILAI_DILIHAT = "dilihat";

/** Penyimpanan minimal yang dipakai; localStorage memenuhinya. */
export type Penyimpanan = Pick<Storage, "getItem" | "setItem">;

/** localStorage bila tersedia; null di server atau bila browser menolaknya. */
export function penyimpananLokal(): Penyimpanan | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function baca(simpan: Penyimpanan | null, kunci: string): string | null {
  try {
    return simpan?.getItem(kunci) ?? null;
  } catch {
    return null;
  }
}

/** Tur dengan kunci ini sudah pernah selesai atau dilewati di perangkat ini. */
export function sudahDilihat(simpan: Penyimpanan | null, kunci: string): boolean {
  return baca(simpan, AWALAN_KUNCI + kunci) === NILAI_DILIHAT;
}

export function tandaiDilihat(simpan: Penyimpanan | null, kunci: string): void {
  try {
    simpan?.setItem(AWALAN_KUNCI + kunci, NILAI_DILIHAT);
  } catch {
    // Penyimpanan penuh atau ditolak: tur tampil lagi lain kali, tidak lebih.
  }
}

/**
 * Tur tampil sendiri bila belum pernah dilihat dan saklar uji tidak
 * mematikannya. Tanpa penyimpanan, tur tidak tampil sendiri agar tidak
 * muncul di setiap kunjungan.
 */
export function bolehTampilSendiri(simpan: Penyimpanan | null, kunci: string): boolean {
  if (!simpan) return false;
  if (baca(simpan, SAKLAR_OTOMATIS) === NILAI_SAKLAR_MATI) return false;
  return !sudahDilihat(simpan, kunci);
}

export interface Kotak {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Kotak sorotan: kotak elemen ditambah jarak di keempat sisi. */
export function kotakSorotan(r: Kotak, jarak = 6): Kotak {
  return { top: r.top - jarak, left: r.left - jarak, width: r.width + jarak * 2, height: r.height + jarak * 2 };
}

/**
 * Kotak sorotan dipotong ke bagian yang tampil di layar (JB9a, pemilik
 * proyek 24 November 2026). Target yang lebih tinggi dari layar, misalnya
 * daftar tujuh hari jam buka, digulir ke tengah sehingga tepi atasnya jauh
 * di atas layar; tanpa pemotongan, balon yang berlabuh ke tepi itu ikut
 * keluar layar. `tepi` menyisakan ruang untuk cincin sorotan (3 px) agar
 * tetap terlihat di tepi layar. Kotak yang tidak bersinggungan dengan layar
 * (sebelum gulir selesai) dikembalikan apa adanya.
 */
export function potongKeLayar(k: Kotak, lebar: number, tinggi: number, tepi = 3): Kotak {
  const atas = Math.max(k.top, tepi);
  const kiri = Math.max(k.left, tepi);
  const bawah = Math.min(k.top + k.height, tinggi - tepi);
  const kanan = Math.min(k.left + k.width, lebar - tepi);
  if (bawah <= atas || kanan <= kiri) return k;
  return { top: atas, left: kiri, width: kanan - kiri, height: bawah - atas };
}

/**
 * Jangkar balon. Bila sorotan lebih tinggi dari ruang layar, bagian yang
 * tampil memenuhi layar sehingga balon tidak punya ruang di atas maupun di
 * bawahnya; jangkarnya menjadi garis tepi atas bagian yang tampil, dan balon
 * tampil di bawah garis itu, di dalam sorotan (JB9a lanjutan, pemilik
 * proyek 24 November 2026). Selain itu jangkar sama dengan sorotan.
 */
export function jangkarBalon(
  asli: Kotak,
  terpotong: Kotak,
  tinggi: number,
  tepi = 3,
): { kotak: Kotak; diDalam: boolean } {
  if (asli.height <= tinggi - tepi * 2) return { kotak: terpotong, diDalam: false };
  return { kotak: { ...terpotong, height: 0 }, diDalam: true };
}

export function kotakSama(a: Kotak | null, b: Kotak | null): boolean {
  if (!a || !b) return a === b;
  return (
    Math.round(a.top) === Math.round(b.top) &&
    Math.round(a.left) === Math.round(b.left) &&
    Math.round(a.width) === Math.round(b.width) &&
    Math.round(a.height) === Math.round(b.height)
  );
}
