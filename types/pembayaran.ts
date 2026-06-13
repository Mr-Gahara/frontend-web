export type StatusPembayaran = "PAID" | "PENDING" | "EXPIRED" | "FAILED" | "VOID";

export interface Pembayaran {
  _id: string;
  tenantID: string;
  akunKasID: any; 
  penjualanID: any;
  metodePembayaranID: any;
  noReferensi: string;
  tanggalBayar: string | null;
  gatewayPaymentID?: string;
  qrString?: string;
  jumlahBayar: number;
  status: StatusPembayaran;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PembayaranRequest {
  penjualanID: string;
  akunKasID: string;
  metodePembayaranID: string;
  jumlahBayar: number;
  tanggalBayar?: string; // ISO String
  catatan?: string;
  status?: StatusPembayaran;
}