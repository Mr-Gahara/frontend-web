
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
 * Bentuk populate mentah untuk halaman yang belum dimigrasikan dan masih
 * membaca respons lewat lib/apiClient.ts. Tipe berakhiran Lama di berkas ini
 * dihapus saat detail dan pembayaran dimigrasikan (submodul 3 dan 4,
 * keputusan K8).
 */
export interface DataPenggunaLama {
  _id: string;
  nama: string;
}

/** Pelanggan penjualan, hasil populate pelangganID. */
export interface DataPelanggan {
  id: string;
  namaPelanggan: string;
  tipePelanggan?: string;
  nomorHp?: string;
}

export interface DataPelangganLama {
  _id: string;
  namaPelanggan: string;
}

/**
 * Rincian pajak per item dan per transaksi dari mapPenjualanResponse. Hanya
 * field yang sudah dipastikan dari mapper; bentuk lengkapnya dipastikan saat
 * detail penjualan dimigrasikan (submodul 3).
 */
export interface RincianPajak {
  id: string | null;
  namaPajak: string | null;
  tarifPajak: number;
  jumlah: number;
}

/** Bentuk lama yang tidak sesuai mapper (pajakID, tipe, nilai, jumlahPajak). */
export interface RincianPajakLama {
  pajakID: string;
  namaPajak: string;
  tipe: string;
  nilai: number;
  jumlahPajak: number;
}

export interface RincianDiskon {
  diskonID: string;
  namaDiskon: string;
  tipe: "persen" | "nominal";
  nilai: number;
  jumlahDiskon: number;
}

// ITEM PENJUALAN
/** Item penjualan dari mapPenjualanResponse; field diskon item dipastikan di submodul 3. */
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

export interface ItemPenjualanLama {
  sesiBookingID: string | null;
  produkID: string;
  namaProduk: string;
  jumlah: number;
  hargaJual: number;
  subTotal: number;
  diskonItem: RincianDiskon[];
  jumlahDiskon: number;
  total: number;
  rincianPajak: RincianPajakLama[];
  jumlahPajak: number;
  totalharga: number;
}

// ENTITAS PENJUALAN (response dari backend)
/**
 * Bentuk respons GET /penjualan dan /penjualan/:id setelah dinormalkan,
 * mengikuti mapPenjualanResponse backend. diskonGlobal belum ditipekan rinci;
 * bentuknya dipastikan saat detail penjualan dimigrasikan (submodul 3).
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

/** Bentuk lama untuk detail dan pembayaran yang belum dimigrasikan (keputusan K8). */
export interface PenjualanLama {
  _id: string;
  tenantID: string;
  locationID: string | null;
  noReferensi: string;
  dataPengguna: DataPenggunaLama;
  dataPelanggan: DataPelangganLama;
  jenisTransaksi: JenisTransaksi;
  jenisPenjualan: JenisPenjualan;
  tanggalTransaksi: string;
  itemPenjualan: ItemPenjualanLama[];
  totalHargaProduk: number;
  diskonGlobal: RincianDiskon[];
  jumlahDiskonTransaksi: number;
  pajakTransaksi: RincianPajakLama[];
  jumlahPajakTransaksi: number;
  totalTagihan: number;
  totalDibayar: number;
  sisaTagihan: number;
  statusBayar: StatusBayar;
  statusPenjualan: StatusPenjualan;
  keterangan: string;
  jatuhTempo?: string;
  simpanDraft?: boolean;
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
  /** Opsional: backend menentukan lokasi dari sesi bila tidak dikirim. */
  locationID?: string;
  pelangganID: string;
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

// API RESPONSE SHAPES
export interface GetPenjualanResponse {
  data: PenjualanLama[];
}

export interface PenjualanResponse {
  data: PenjualanLama;
}

// ENTITAS PENDUKUNG (untuk form)
// Dipakai di combobox pelanggan pada form create/edit
export interface PelangganOption {
  _id: string;
  namaPelanggan: string;
  tipePelanggan: "umum" | "korporat" | "member";
  nomorHp?: string;
}

export interface GetPelangganResponse {
  data: PelangganOption[];
}

// Dipakai di combobox/multiselect diskon pada form create/edit
export interface DiskonOption {
  _id: string;
  namaDiskon: string;
  cakupan: "Global" | "Item";
  tipe: "persen" | "nominal";
  nilai: number;
  bisaDigabung: boolean;
  status: "Aktif" | "Non-Aktif";
}

export interface GetDiskonResponse {
  data: DiskonOption[];
}