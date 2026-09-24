export type StatusPembayaran = "PAID" | "PENDING" | "EXPIRED" | "FAILED" | "VOID";

/**
 * Bentuk respons GET /pembayaran setelah dinormalkan, mengikuti
 * mappers/pembayaranMapper.js backend: ketiga referensi dikirim sebagai id
 * string (_extractId), bukan objek hasil populate.
 */
export interface Pembayaran {
  id: string;
  tenantID: string;
  akunKasID: string | null;
  penjualanID: string | null;
  metodePembayaranID: string | null;
  noReferensi: string;
  tanggalBayar: string | null;
  gatewayPaymentID: string | null;
  qrString: string | null;
  jumlahBayar: number;
  status: StatusPembayaran;
  catatan: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload POST /pembayaran. status tidak dikirim (keputusan K2a): backend
 * menentukannya sendiri. tanggalBayar wajib karena status akhirnya PAID.
 */
export interface PembayaranRequest {
  penjualanID: string;
  akunKasID: string;
  metodePembayaranID: string;
  jumlahBayar: number;
  tanggalBayar: string;
  catatan?: string;
}