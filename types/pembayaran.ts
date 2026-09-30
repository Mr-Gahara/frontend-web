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
  namaMetodePembayaran: string | null;
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
 * Payload POST /pembayaran. status tidak dikirim (keputusan K2a), dan
 * akunKasID juga tidak: sejak backend 465b438 keduanya diatur server, akun
 * kas diambil dari metode, dan mengirimnya ditolak 400. tanggalBayar wajib
 * karena status akhirnya PAID.
 */
export interface PembayaranRequest {
  penjualanID: string;
  metodePembayaranID: string;
  jumlahBayar: number;
  tanggalBayar: string;
  catatan?: string;
}

/** Payload PUT /pembayaran/:id untuk membatalkan; catatan menjadi alasan di buku mutasi kas. */
export interface PembatalanPembayaranRequest {
  status: "VOID";
  catatan?: string;
}