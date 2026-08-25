export const formatRupiah = (angka: number): string => {
  // Fallback jika nilai yang masuk tiba-tiba undefined/null dari API
  if (angka === undefined || angka === null) return "Rp 0";
  
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
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