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

export interface StockAdjustmentItem {
  itemId: string;
  bahanBakuID: string | null;
  barangInventoryID: string | null;
  namaSnapshot: string | null;
  satuanSnapshot: string | null;
  qtySebelum: number;
  qtyPhysical: number;
  qtyAdjustment: number;
  catatanItem: string | null;
}

export interface StockAdjustment {
  id: string;
  tenantID: string | null;
  nomorAdjustment: string;
  tanggal: string | null;
  lokasi: LokasiRelasi | null;
  pic: RelasiBase | null;
  stockOpnameID: string | null;
  items?: StockAdjustmentItem[];
  catatan: string | null;
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
