import type { StatusPenjualan } from "./penjualan";

export interface SesiBookingItemPayload {
  dataAset: string;
  waktuMulai: string;
  waktuSelesai: string;
  dataTarif?: string;
  diskonItem?: string[];
}

export interface SesiBookingBatchPayload {
  tenantID?: string;
  dataPengguna?: string;
  dataPelanggan: string;
  noReferensi?: string;
  diskonGlobal?: string[];
  items: SesiBookingItemPayload[];
}

export interface SesiBookingBatchResponse {
  penjualanID: string;
  totalBookings: number;
  noReferensi: string;
}

export interface SesiBookingRef {
  id: string | null;
}

export interface SesiBookingAsetRef extends SesiBookingRef {
  namaAset: string | null;
  status: string | null;
}

export interface SesiBookingPelangganRef extends SesiBookingRef {
  namaPelanggan: string | null;
  tipePelanggan: string | null;
}

export interface SesiBookingPenggunaRef extends SesiBookingRef {
  nama: string | null;
}

export interface SesiBookingTarifRef extends SesiBookingRef {
  namaTarif: string | null;
  harga: number | null;
}

/**
 * Penjualan booking yang di-populate daftar dan detail sesi booking
 * (mappers/sesiBookingMapper.js, _formatPenjualanOutput). Hanya field yang
 * dipakai web; _id dinormalkan menjadi id.
 */
export interface SesiBookingPenjualanRef {
  id: string;
  noReferensi: string | null;
  statusPenjualan: StatusPenjualan;
  statusBayar: string;
  totalTagihan: number;
  sisaTagihan: number;
}

/**
 * Status booking sejak backend 465b438: Batal diganti VOID, dan Tidak Datang
 * dihitung saat dibaca bila booking belum check-in sampai batas terlambat.
 */
export type StatusBooking = "Aktif" | "Selesai" | "VOID" | "Tidak Datang";

export interface SesiBookingResponse {
  id: string;
  tenantID: string | null;
  dataPengguna: SesiBookingPenggunaRef | null;
  dataPelanggan: SesiBookingPelangganRef | null;
  dataAset: SesiBookingAsetRef | null;
  dataTarif: SesiBookingTarifRef | null;
  waktuMulai: string;
  waktuSelesai: string | null;
  durasiMenit: number | null;
  totalBiaya: number | null;
  status: StatusBooking;
  /** Jadwal baru terkunci setelah penjualannya menerima uang (backend 465b438). */
  sudahDibayar: boolean;
  waktuCheckIn?: string | null;
  batasCheckIn?: string | null;
  dataPenjualan: SesiBookingPenjualanRef | null;
}

export interface SesiBookingListApiResponse {
  data: SesiBookingResponse[];
}