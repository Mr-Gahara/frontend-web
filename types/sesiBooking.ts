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
  status: "Aktif" | "Selesai" | "Batal";
  dataPenjualan: unknown | null;
}

export interface SesiBookingListApiResponse {
  data: SesiBookingResponse[];
}