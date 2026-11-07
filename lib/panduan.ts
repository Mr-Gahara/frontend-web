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
  isi: string;
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

export function kotakSama(a: Kotak | null, b: Kotak | null): boolean {
  if (!a || !b) return a === b;
  return (
    Math.round(a.top) === Math.round(b.top) &&
    Math.round(a.left) === Math.round(b.left) &&
    Math.round(a.width) === Math.round(b.width) &&
    Math.round(a.height) === Math.round(b.height)
  );
}
