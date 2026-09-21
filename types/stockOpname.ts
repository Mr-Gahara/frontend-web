export type StatusOpname =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface RelasiBase {
  id: string;
  nama: string | null;
}

export interface LokasiRelasi extends RelasiBase {
  tipe: string | null;
  alamat?: string;
}

export interface StockAdjustmentRelasi {
  id: string;
  nomorAdjustment: string | null;
  tanggal: string | null;
}

export interface StockOpnameItem {
  itemId: string;
  bahanBakuID: string | null;
  barangInventoryID: string | null;
  namaSnapshot: string;
  satuanSnapshot: string;
  qtySystemSnapshot: number;
  qtyPhysical: number | null;
  varianceSnapshot: number | null;
  adaSelisih: boolean;
  catatanItem: string | null;
}

export interface StockOpname {
  id: string;
  tenantID: string | null;
  nomorOpname: string;
  status: StatusOpname;
  tanggal: string | null;
  lokasi: LokasiRelasi | null;
  pic: RelasiBase | null;
  reviewer: RelasiBase | null;
  items?: StockOpnameItem[];
  catatan: string | null;
  catatanReview: string | null;
  stockAdjustment: StockAdjustmentRelasi | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Item adjustment dari mappers/stockOpnameMapper.js. Keempat kuantitas wajib
 * di models/stockAdjustmentModel.js, sehingga selalu berisi nilai nyata.
 */
export interface StockAdjustmentItem {
  itemId: string;
  bahanBakuID: string | null;
  barangInventoryID: string | null;
  namaSnapshot: string | null;
  satuanSnapshot: string | null;
  /** Stok sistem saat draf opname dibuat. */
  qtySnapshot: number;
  /** Stok sistem saat approval, dasar perhitungan koreksi. */
  qtyCurrent: number;
  qtyPhysical: number;
  /** qtyPhysical - qtyCurrent; positif menambah, negatif mengurangi. */
  qtyDifference: number;
}

export type SumberAdjustment = "STOCK_OPNAME" | "MANUAL_CORRECTION";

/** Dokumen stock opname hasil populate pada respons adjustment. */
export interface RelasiOpname {
  id: string;
  nomorOpname: string;
  tanggal: string | null;
}

export interface StockAdjustment {
  id: string;
  tenantID: string | null;
  nomorAdjustment: string;
  tanggal: string | null;
  lokasi: LokasiRelasi | null;
  pic: RelasiBase | null;
  referenceType: SumberAdjustment | null;
  /**
   * Dokumen stock opname pemicu, berisi objek hasil populate
   * (stockOpnameService baris 557 untuk daftar dan 581 untuk detail), bukan
   * string id. Null untuk koreksi manual atau bila dokumen opnamenya sudah
   * tidak ada.
   */
  referenceID: RelasiOpname | null;
  items?: StockAdjustmentItem[];
  alasan: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOpnameRequest {
  locationID: string;
  catatan?: string;
}

export interface UpdatePhysicalItem {
  itemId: string;
  qtyPhysical: number;
  catatanItem?: string;
}

export interface UpdatePhysicalRequest {
  items: UpdatePhysicalItem[];
}

export interface ReviewOpnameRequest {
  alasan?: string;
  catatanReview?: string;
}
