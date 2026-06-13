
// ENUMS / KONSTANTA
export type StatusBayar = "UNPAID" | "PAID" | "PARTIAL";
export type StatusPenjualan = "DRAFT" | "FINAL" | "VOID";
export type JenisTransaksi = "POS" | "INVOICE";
export type JenisPenjualan = "dine-in" | "takeaway" | "booking";

// ENTITAS POPULATED (dari backend)
export interface DataPengguna {
  _id: string;
  nama: string;
}

export interface DataPelanggan {
  _id: string;
  namaPelanggan: string;
}

export interface RincianPajak {
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
export interface ItemPenjualan {
  sesiBookingID: string | null;
  produkID: string;
  namaProduk: string;
  jumlah: number;
  hargaJual: number;
  subTotal: number;
  diskonItem: RincianDiskon[];
  jumlahDiskon: number;
  total: number;
  rincianPajak: RincianPajak[];
  jumlahPajak: number;
  totalharga: number;
}

// ENTITAS PENJUALAN (response dari backend)
export interface Penjualan {
  _id: string;
  tenantID: string;
  noReferensi: string;
  dataPengguna: DataPengguna;
  dataPelanggan: DataPelanggan;
  jenisTransaksi: JenisTransaksi;
  jenisPenjualan: JenisPenjualan;
  tanggalTransaksi: string;
  itemPenjualan: ItemPenjualan[];
  totalHargaProduk: number;
  diskonGlobal: RincianDiskon[];
  jumlahDiskonTransaksi: number;
  pajakTransaksi: RincianPajak[];
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
  data: Penjualan[];
}

export interface PenjualanResponse {
  data: Penjualan;
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