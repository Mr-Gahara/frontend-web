
// ENUMS / KONSTANTA
export type StatusBayar = "UNPAID" | "PAID" | "PARTIAL";
export type StatusPenjualan = "DRAFT" | "FINAL" | "VOID";
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
  keterangan: string;
  createdAt: string;
  updatedAt: string;
}

// REQUEST PAYLOAD
export interface ItemPenjualanRequest {
  produkID: string;
  jumlah: number;
  hargaJual?: number;
  diskonItemIDs?: string[];
  jumlahDiskon?: number;
}

export interface PenjualanRequest {
  /** Outlet tenant bagi pemegang read-location (keputusan K13a); tanpanya tidak dikirim. */
  locationID?: string;
  pelangganID: string;
  /** Diwajibkan validator backend; controller menggantinya dengan pengguna dari token. */
  penggunaID: string;
  jenisTransaksi: JenisTransaksi;
  jenisPenjualan: JenisPenjualan;
  tanggalTransaksi: string;
  itemPenjualan: ItemPenjualanRequest[];
  diskonGlobalIDs?: string[];
  pajakTransaksiIDs?: string[];
  jumlahDiskonTransaksi?: number;
  keterangan?: string;
  jatuhTempo?: string;
  simpanDraft?: boolean;
}

export interface PenjualanUpdateRequest {
  locationID?: string;
  pelangganID?: string;
  tanggalTransaksi?: string;
  itemPenjualan?: ItemPenjualanRequest[];
  diskonGlobalIDs?: string[];
  pajakTransaksiIDs?: string[];
  jumlahDiskonTransaksi?: number;
  keterangan?: string;
  jatuhTempo?: string;
  finalize?: boolean;
}

// FILTER PARAMS (untuk GET /penjualan)
export interface PenjualanFilterParams {
  statusBayar?: StatusBayar;
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
