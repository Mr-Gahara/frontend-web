export type StatusOpname = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface StockOpnameItem {
  _id: string;
  bahanBakuID: string | null;
  barangInventoryID: string | null;
  namaSnapshot: string;
  satuanSnapshot: string;
  qtySystemSnapshot: number;
  qtyPhysical: number | null;
  varianceSnapshot: number | null;
  catatanItem?: string;
}

export interface StockOpname {
  _id: string;
  nomorOpname: string;
  locationID: string;
  tanggal: string;
  picID: string;
  status: StatusOpname;
  items: StockOpnameItem[];
  catatan?: string;
  tenantID: string;
  reviewerID?: string;
  catatanReview?: string;
  stockAdjustmentID?: string;
}

export interface StockAdjustmentItem {
  bahanBakuID: string | null;
  namaSnapshot: string;
  satuanSnapshot: string;
  qtySnapshot: number;
  qtyCurrent: number;
  qtyPhysical: number;
  qtyDifference: number;
}

export interface StockAdjustment {
  _id: string;
  nomorAdjustment: string;
  tanggal: string;
  locationID: string;
  picID: string;
  referenceType: string;
  referenceID: string;
  alasan?: string;
  items: StockAdjustmentItem[];
}

// PAYLOAD REQUESTS
export interface CreateOpnameRequest {
  locationID: string;
  picID: string;
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
  alasan?: string;        // Digunakan saat Approve
  catatanReview?: string; // Digunakan saat Reject
}