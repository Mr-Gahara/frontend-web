import type { ItemPembelianStok, LokasiPembelian, PembelianStok } from "@/types/pembelianStok";

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
 * Jumlah beserta satuannya, misalnya "1,5 kg". Pembelian bersatuan kemasan
 * (B361) menyebut jumlah dasarnya: "22 kaleng (6.380 ml)". Batas pecahan
 * ditulis eksplisit agar teksnya sama di server, test, dan browser
 * (keputusan rancangan butir 24).
 */
export function teksJumlahItem(item: ItemPembelianStok): string {
  const angka = item.jumlah.toLocaleString("id-ID", { maximumFractionDigits: 3 });
  const dasar = item.bahanBakuID?.satuan;
  const satuan = item.satuan || dasar;
  const teks = satuan ? `${angka} ${satuan}` : angka;
  if (item.satuan && dasar && item.satuan !== dasar && typeof item.jumlahDasar === "number") {
    return `${teks} (${item.jumlahDasar.toLocaleString("id-ID", { maximumFractionDigits: 3 })} ${dasar})`;
  }
  return teks;
}

export function namaAkunPembelian(pembelian: PembelianStok): string {
  return pembelian.akunKasID?.namaAkun || "-";
}

/**
 * Pembelian yang memotong saldo akun kas (P64, B281). Pembelian sebelum
 * backend 916e7df tidak membawa saldoDipotong dan tidak memotong saldo.
 */
export function saldoTerpotong(pembelian: Pick<PembelianStok, "saldoDipotong">): boolean {
  return pembelian.saldoDipotong === true;
}

export function namaPencatat(pembelian: PembelianStok): string {
  return pembelian.dicatatOleh?.nama || "-";
}

/**
 * Lokasi penerima dari locationID ter-populate (B112). null bila pembelian
 * lama tanpa lokasi, atau lokasinya terhapus.
 */
export function lokasiPembelian(pembelian: PembelianStok): LokasiPembelian | null {
  return pembelian.locationID ?? null;
}