import { denganTabKritis } from "@/features/inventaris/tab-stok";
import { bolehTautan, type AksesTautan } from "./akses";
import type { Pemberitahuan, TautanPemberitahuan } from "./jenis";

export const URL_PRODUK = "/dashboard/outlet/inventaris/produk";
export const URL_BUAT_PRODUK = "/dashboard/outlet/inventaris/produk/buatProduk";
export const URL_CATAT_PEMBELIAN = "/dashboard/outlet/inventaris/pembelianStok/catatPembelian";

/** Hitungan produk di ringkasan dashboard outlet (B380, produk.total dan produk.dapatDijual). */
export interface HitunganProduk {
  total: number;
  dapatDijual: number;
}

/** Pemicu LN1a dari hitungan ringkasan. */
export type PemicuStokProduk = { jenis: "tanpa-produk" } | { jenis: "tak-terjual"; jumlah: number };

/**
 * LN1a: toko tanpa produk, atau tidak ada satu pun produk yang dapat dijual
 * (produk unlimited, atau berstok di atas 0 termasuk stok terhitung resep).
 * Dihitung backend di ringkasan dashboard outlet (B380), sehingga lonceng
 * tidak lagi memuat seluruh produk (PW07). Tanpa ringkasan: tidak ada pemicu.
 */
export function pemicuStokProduk(hitungan: HitunganProduk | null | undefined): PemicuStokProduk | null {
  if (!hitungan) return null;
  if (hitungan.total === 0) return { jenis: "tanpa-produk" };
  if (hitungan.dapatDijual > 0) return null;
  return { jenis: "tak-terjual", jumlah: hitungan.total };
}

/**
 * Kartu LN1a. Tanpa produk ke Buat Produk. Tidak ada yang dapat dijual: kartu
 * cukup angka, jumlah produk yang stoknya habis tanpa menyebut namanya, dengan
 * tautan Lihat produk dan Pembelian Stok (pemilik proyek, PW07, menggantikan
 * pemisahan jenis LN2a dan LN14a). Tautan hanya bagi pemegang izinnya.
 */
export function pemberitahuanStokProduk(
  pemicu: PemicuStokProduk | null,
  akses: AksesTautan,
): Pemberitahuan | null {
  if (!pemicu) return null;
  const tautan: TautanPemberitahuan[] = [];
  const tambah = (href: string, label: string) => {
    if (bolehTautan(akses, href)) tautan.push({ href, label });
  };

  if (pemicu.jenis === "tanpa-produk") {
    tambah(URL_BUAT_PRODUK, "Buat Produk");
    return {
      id: "stok-produk",
      tingkat: "penting",
      judul: "Toko belum punya produk",
      isi: "Belum ada produk yang dapat dijual. Buat produk lebih dulu agar kasir dapat mencatat penjualan.",
      tautan,
    };
  }

  tambah(URL_PRODUK, "Lihat produk");
  tambah(URL_CATAT_PEMBELIAN, "Pembelian Stok");
  return {
    id: "stok-produk",
    tingkat: "penting",
    judul: "Tidak ada produk yang dapat dijual",
    isi: `${pemicu.jumlah} produk stoknya habis.`,
    tautan,
  };
}

/** LN1a tingkat sedang: produk berstok langsung yang mencapai stok minimum (ringkasan dashboard outlet). */
export function pemberitahuanProdukMinimum(jumlah: number | null | undefined, akses: AksesTautan): Pemberitahuan | null {
  if (!jumlah || jumlah <= 0) return null;
  return {
    id: "produk-minimum",
    tingkat: "tindakan",
    judul: "Stok produk menipis",
    isi: `${jumlah} produk mencapai stok minimum.`,
    // Langsung tab Stok Kritis daftar Produk (LN16a).
    tautan: bolehTautan(akses, URL_PRODUK) ? [{ href: denganTabKritis(URL_PRODUK), label: "Lihat produk" }] : [],
  };
}
