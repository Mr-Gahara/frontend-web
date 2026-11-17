/**
 * Paket membership toko (GET /api/paketmembership, mappers/paketMembershipMapper.js
 * backend 4a19be8). Daftar diurutkan backend dari harga termurah.
 */
export interface PaketMembership {
  id: string;
  tenantID: string;
  namaPaket: string;
  harga: number;
  durasiHari: number;
  deskripsi: string | null;
  status: StatusPaketMembership;
  createdAt: string;
  updatedAt: string;
}

export type StatusPaketMembership = "Aktif" | "Non-Aktif";

export interface PaketMembershipPayload {
  namaPaket?: string;
  harga?: number;
  durasiHari?: number;
  deskripsi?: string | null;
  status?: StatusPaketMembership;
}

/**
 * Membership pelanggan (GET /api/membership): pembelian paket yang berasal
 * dari satu penjualan. Status dihitung backend saat dibaca dari
 * tanggalKadaluarsa. Relasi yang sudah terhapus bernilai null.
 */
export interface Membership {
  id: string;
  tenantID: string;
  pelanggan: { id: string; namaPelanggan: string; nomorHp?: string | null } | null;
  paketMembership: { id: string; namaPaket: string; durasiHari: number } | null;
  penjualan: { id: string; noReferensi: string } | null;
  /** 00.00 WIB hari mulai. */
  tanggalMulai: string;
  /** 23.59.59,999 WIB hari terakhir; hari mulai ikut dihitung. */
  tanggalKadaluarsa: string;
  status: StatusMembership;
  createdAt: string;
  updatedAt: string;
}

export type StatusMembership = "Aktif" | "Kadaluarsa";

export interface BuatMembershipPayload {
  pelangganID: string;
  paketMembershipID: string;
  penjualanID: string;
  /** YYYY-MM-DD hari WIB; kosong berarti hari ini. */
  tanggalMulai?: string;
}

/** Backend hanya menerima ubah paket dan tanggal mulai; pelanggan dan penjualan terkunci. */
export interface UbahMembershipPayload {
  paketMembershipID?: string;
  tanggalMulai?: string;
}
