import type { Lokasi } from "@/types/location";
import type { ItemPembelianStok, PembelianStok } from "@/types/pembelianStok";

/** Nama bahan satu barang; bahan yang sudah terhapus dari master ditandai. */
export function namaBahanItem(item: ItemPembelianStok): string {
  return item.bahanBakuID?.namaBahan || "Bahan Terhapus";
}

/** Ringkasan kolom Barang di daftar: barang pertama dan jumlah barang lain. */
export function ringkasBarang(items: readonly ItemPembelianStok[]): {
  utama: string;
  lainnya: string | null;
} {
  if (items.length === 0) return { utama: "-", lainnya: null };
  return {
    utama: namaBahanItem(items[0]),
    lainnya: items.length > 1 ? `+${items.length - 1} barang lain` : null,
  };
}

/**
 * Jumlah beserta satuan bahan di master, misalnya "1,5 kg". Batas pecahan
 * ditulis eksplisit agar teksnya sama di server, test, dan browser
 * (keputusan rancangan butir 24).
 */
export function teksJumlahItem(item: ItemPembelianStok): string {
  const angka = item.jumlah.toLocaleString("id-ID", { maximumFractionDigits: 3 });
  const satuan = item.bahanBakuID?.satuan;
  return satuan ? `${angka} ${satuan}` : angka;
}

export function namaAkunPembelian(pembelian: PembelianStok): string {
  return pembelian.akunKasID?.namaAkun || "-";
}

export function namaPencatat(pembelian: PembelianStok): string {
  return pembelian.dicatatOleh?.nama || "-";
}

/**
 * Lokasi penerima dari daftar lokasi, karena respons pembelian hanya membawa
 * id-nya. null selama daftar belum termuat, atau bila lokasinya terhapus.
 */
export function lokasiPembelian(
  pembelian: PembelianStok,
  daftarLokasi: readonly Lokasi[] | undefined,
): Lokasi | null {
  if (!pembelian.locationID || !daftarLokasi) return null;
  return daftarLokasi.find((l) => l.id === pembelian.locationID) ?? null;
}