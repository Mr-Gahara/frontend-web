export const formatRupiah = (angka: number): string => {
  // Fallback jika nilai yang masuk tiba-tiba undefined/null dari API
  if (angka === undefined || angka === null) return "Rp 0";
  
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    // Eksplisit agar hasilnya sama di setiap runtime: batas bawaan untuk IDR
    // bergantung pada versi ICU (0 di Node 22, lebih dari 0 di Chromium).
    maximumFractionDigits: 2,
  }).format(angka);
};

export const formatTanggal = (iso: string): string => {
  if (!iso) return "-";
  
  const date = new Date(iso);
  // Mengecek apakah objek Date berstatus "Invalid Date"
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatTanggalPendek = (iso: string): string => {
  if (!iso) return "-";
  
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};
/**
 * Angka jumlah barang dengan pemisah ribuan Indonesia dan paling banyak tiga
 * angka pecahan, misalnya 6.115 atau 0,025 (batas pecahan eksplisit seperti
 * formatRupiah, keputusan rancangan butir 24).
 */
const ANGKA_JUMLAH = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 });
export const formatAngka = (angka: number): string => ANGKA_JUMLAH.format(angka);
