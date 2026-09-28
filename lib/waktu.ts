/**
 * Aturan input waktu jam dan menit untuk seluruh frontend (keputusan K-TW1,
 * K-TW4, dan K-TW5). Dipakai InputWaktu dan halaman pemakainya, sehingga
 * aturan yang sebelumnya ditulis berbeda di buat penjualan, buat reservasi,
 * tarif, dan form shift menjadi satu.
 *
 * - Hanya angka yang diterima, maksimal dua digit.
 * - Ketikan yang membuat nilai melebihi batas ditolak; isian tetap berisi
 *   nilai sah terakhir (K-TW4a).
 * - Isian kosong dibiarkan kosong; halaman pemakai menolaknya saat simpan
 *   (K-TW5a).
 */

export const BATAS_JAM = 23;
export const BATAS_MENIT = 59;

export interface NilaiWaktu {
  jam: string;
  menit: string;
}

export const WAKTU_KOSONG: NilaiWaktu = { jam: "", menit: "" };

/** Nilai isian setelah pengguna mengetik atau menempel teks. */
export function terimaKetikan(sebelum: string, masukan: string, batas: number): string {
  const angka = masukan.replace(/\D/g, "");
  if (angka === "") return "";
  if (angka.length > 2) return sebelum;
  if (Number(angka) > batas) return sebelum;
  return angka;
}

/** Nilai isian saat fokus lepas: satu digit diberi nol di depan, kosong tetap kosong. */
export function rapikanBagian(nilai: string): string {
  return nilai === "" ? "" : nilai.padStart(2, "0");
}

/** Waktu lengkap bila jam dan menit sama-sama terisi angka dalam batas. */
export function waktuLengkap(waktu: NilaiWaktu): boolean {
  return (
    /^\d{1,2}$/.test(waktu.jam) &&
    /^\d{1,2}$/.test(waktu.menit) &&
    Number(waktu.jam) <= BATAS_JAM &&
    Number(waktu.menit) <= BATAS_MENIT
  );
}

/** Teks "HH:mm" dari waktu lengkap; string kosong bila belum lengkap. */
export function keTeksWaktu(waktu: NilaiWaktu): string {
  if (!waktuLengkap(waktu)) return "";
  return `${waktu.jam.padStart(2, "0")}:${waktu.menit.padStart(2, "0")}`;
}

/** Nilai isian dari teks "HH:mm"; teks lain menghasilkan isian kosong. */
export function dariTeksWaktu(teks: string | null | undefined): NilaiWaktu {
  const cocok = /^(\d{2}):(\d{2})$/.exec(teks ?? "");
  if (!cocok) return WAKTU_KOSONG;
  const waktu = { jam: cocok[1], menit: cocok[2] };
  return waktuLengkap(waktu) ? waktu : WAKTU_KOSONG;
}

/** Nilai isian dari sebuah Date, untuk nilai awal "sekarang". */
export function waktuDari(tanggal: Date): NilaiWaktu {
  return {
    jam: String(tanggal.getHours()).padStart(2, "0"),
    menit: String(tanggal.getMinutes()).padStart(2, "0"),
  };
}

/**
 * Date baru dari tanggal dan waktu lengkap, dengan detik dan milidetik 0.
 * Null bila waktu belum lengkap, sehingga pemanggil tidak pernah membentuk
 * tanggal yang bergeser atau tidak valid dari isian yang salah.
 */
export function gabungTanggalWaktu(tanggal: Date, waktu: NilaiWaktu): Date | null {
  if (!waktuLengkap(waktu)) return null;
  const hasil = new Date(tanggal);
  hasil.setHours(Number(waktu.jam), Number(waktu.menit), 0, 0);
  return hasil;
}

/** Tanggal lokal YYYY-MM-DD, bentuk query tanggal yang dibaca backend. */
export function keTanggalLokal(tanggal: Date): string {
  const bulan = String(tanggal.getMonth() + 1).padStart(2, "0");
  const hari = String(tanggal.getDate()).padStart(2, "0");
  return `${tanggal.getFullYear()}-${bulan}-${hari}`;
}

/** Date lokal pukul 00.00 dari teks YYYY-MM-DD; undefined untuk teks lain atau tanggal yang tidak ada. */
export function dariTanggalLokal(teks: string | null | undefined): Date | undefined {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(teks ?? "");
  if (!cocok) return undefined;
  const [tahun, bulan, hari] = [Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3])];
  const hasil = new Date(tahun, bulan, hari);
  return hasil.getFullYear() === tahun && hasil.getMonth() === bulan && hasil.getDate() === hari ? hasil : undefined;
}

/**
 * Nilai isian dari teks jam mentah yang disimpan form, termasuk yang belum
 * lengkap ("8:"). Untuk form yang menyimpan waktu sebagai satu teks dan
 * memvalidasinya di skema (tarif); keTeksWaktu tidak dipakai di sana, karena
 * mengembalikan string kosong untuk waktu belum lengkap dan menghapus angka
 * yang baru diketik.
 */
export function pisahTeksWaktu(teks: string | null | undefined): NilaiWaktu {
  if (!teks) return WAKTU_KOSONG;
  const [jam = "", menit = ""] = teks.split(":");
  return { jam, menit };
}

/**
 * Teks jam mentah "jam:menit" untuk disimpan form. Kedua isian kosong
 * menghasilkan ":", sama dengan perilaku sebelumnya, sehingga skema tetap
 * menolaknya.
 */
export function gabungTeksWaktu(waktu: NilaiWaktu): string {
  return `${waktu.jam}:${waktu.menit}`;
}