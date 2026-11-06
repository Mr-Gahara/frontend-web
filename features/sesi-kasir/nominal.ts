/**
 * Isian nominal Rupiah di form tutup kasir: hanya digit yang dibaca, dan
 * tampilannya berpemisah ribuan. Backend menerima bilangan bulat 0 atau lebih
 * (validateHitunganKasir).
 */

/** "1.284.000" menjadi 1284000; isian tanpa digit atau terlalu besar menjadi null. */
export function angkaDariTeks(teks: string): number | null {
  const digit = teks.replace(/\D/g, "");
  if (!digit) return null;
  const angka = Number(digit);
  return Number.isSafeInteger(angka) ? angka : null;
}

/** 1284000 menjadi "1.284.000"; null menjadi isian kosong. */
export function teksRibuan(angka: number | null): string {
  if (angka === null) return "";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(angka);
}