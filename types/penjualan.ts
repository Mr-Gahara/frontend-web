
import type { StatusPembayaran } from "./pembayaran";

// ENUMS / KONSTANTA
export type StatusBayar = "UNPAID" | "PAID" | "PARTIAL";
/**
 * Sejak backend 465b438: UNPAID, PARTIAL, dan PAID dihitung dari uang yang
 * masuk dan selalu sama dengan statusBayar; FINAL tidak ada lagi.
 */
export type StatusPenjualan = "DRAFT" | "UNPAID" | "PARTIAL" | "PAID" | "VOID";
export type JenisTransaksi = "POS" | "INVOICE";
export type JenisPenjualan = "dine-in" | "takeaway" | "booking";

// ENTITAS POPULATED (dari backend)
/** Pengguna pencatat penjualan, hasil populate penggunaID (nama). */
export interface DataPengguna {
  id: string;
  nama: string;
}

/**
 * Pelanggan penjualan, hasil populate pelangganID. Daftar mem-populate
 * nomorHp, detail mem-populate alamat dan email.
 */
export interface DataPelanggan {
  id: string;
  namaPelanggan: string;
  tipePelanggan?: string;
  nomorHp?: string;
  alamat?: string;
  email?: string;
}

/**
 * Rincian pajak per item dan per transaksi dari mapPenjualanResponse. Field
 * model tidak ditipekan: backend menyimpannya dalam array tanpa skema, dan
 * web tidak membacanya.
 */
export interface RincianPajak {
  id: string | null;
  namaPajak: string | null;
  tarifPajak: number;
  jumlah: number;
}

// ITEM PENJUALAN
/** Item penjualan dari mapPenjualanResponse. diskonItem (hasil populate diskon) tidak dibaca web. */
export interface ItemPenjualan {
  sesiBookingID: string | null;
  produkID: string;
  namaProduk: string;
  jumlah: number;
  hargaJual: number;
  subTotal: number;
  jumlahDiskon: number;
  total: number;
  rincianPajak: RincianPajak[];
  jumlahPajak: number;
  totalharga: number;
}

/**
 * Pembayaran di detail penjualan (pembayaran[] sejak backend 465b438).
 * namaMetodePembayaran adalah salinan saat pembayaran dicatat, sehingga
 * metode yang kemudian dinonaktifkan tetap bernama (keputusan K12a).
 */
export interface PembayaranPenjualan {
  id: string;
  namaMetodePembayaran: string | null;
  jumlahBayar: number;
  uangDiterima: number | null;
  kembalian: number | null;
  status: StatusPembayaran;
  tanggalBayar: string | null;
  catatan: string | null;
}

// ENTITAS PENJUALAN (response dari backend)
/**
 * Bentuk respons GET /penjualan dan /penjualan/:id setelah dinormalkan,
 * mengikuti mapPenjualanResponse backend. diskonGlobal (hasil populate
 * diskon) tidak dibaca web, sehingga tidak ditipekan rinci.
 */
export interface Penjualan {
  id: string;
  tenantID: string;
  locationID: string | null;
  noReferensi: string;
  dataPengguna: DataPengguna | null;
  dataPelanggan: DataPelanggan | null;
  jenisTransaksi: JenisTransaksi;
  jenisPenjualan: JenisPenjualan;
  tanggalTransaksi: string;
  jatuhTempo: string | null;
  itemPenjualan: ItemPenjualan[];
  totalHargaProduk: number;
  diskonGlobal: unknown[];
  jumlahDiskonTransaksi: number;
  pajakTransaksi: RincianPajak[];
  jumlahPajakTransaksi: number;
  totalTagihan: number;
  totalDibayar: number;
  sisaTagihan: number;
  statusBayar: StatusBayar;
  statusPenjualan: StatusPenjualan;
  /** Hanya di detail: seluruh pembayaran penjualan ini, termasuk VOID, urut dari yang pertama (backend 465b438). */
  pembayaran?: PembayaranPenjualan[];
  keterangan: string;
  createdAt: string;
  updatedAt: string;
}

// REQUEST PAYLOAD
/**
 * Item payload penjualan (backend 465b438). Harga dan diskon manual
 * (hargaJual, jumlahDiskon) ditolak 400: harga selalu dari produk dan
 * diskon hanya dari master diskon.
 */
export interface ItemPenjualanRequest {
  produkID: string;
  jumlah: number;
  diskonItem?: string[];
}

export interface PenjualanRequest {
  /** Outlet tenant bagi pemegang read-location (keputusan K13a); tanpanya tidak dikirim. */
  locationID?: string;
  pelangganID: string;
  jenisTransaksi: JenisTransaksi;
  jenisPenjualan: JenisPenjualan;
  tanggalTransaksi: string;
  itemPenjualan: ItemPenjualanRequest[];
  /** Diskon transaksi dari master diskon bercakupan Global. */
  diskonGlobal?: string[];
  keterangan?: string;
  jatuhTempo?: string;
  simpanDraft?: boolean;
}


// FILTER PARAMS (untuk GET /penjualan)
export interface PenjualanFilterParams {
  statusPenjualan?: StatusPenjualan;
  jenisTransaksi?: JenisTransaksi;
  jenisPenjualan?: JenisPenjualan;
  pelangganID?: string;
  startDate?: string;
  endDate?: string;
  noReferensi?: string;
}

// Dipakai di combobox pelanggan pada form create/edit

// Dipakai di combobox/multiselect diskon pada form create/edit
