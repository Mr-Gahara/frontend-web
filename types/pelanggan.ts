// types/pelanggan.ts

export type TipePelanggan = "umum" | "member" | "korporat";

/**
 * Bentuk respons GET /pelanggan setelah dinormalkan lib/api/client.ts
 * (kontrak/endpoint.md bagian 3.3).
 */
export interface Pelanggan {
  id: string;
  tenantID: string;
  namaPelanggan: string;
  tipePelanggan: TipePelanggan;
  nomorHp?: string | null;
  email?: string | null;
  alamat?: string | null;
  poinLoyalitas: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bentuk mentah untuk halaman yang belum dimigrasikan dan masih membaca
 * respons lewat lib/apiClient.ts. Dihapus saat modul pelanggan
 * dimigrasikan (keputusan K8, modul penjualan).
 */
export interface PelangganLama {
  _id: string;
  tenantID: string;
  namaPelanggan: string;
  tipePelanggan: TipePelanggan;
  nomorHp?: string;
  email?: string;
  alamat?: string;
  poinLoyalitas: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PelangganRequest {
  namaPelanggan: string;
  tipePelanggan: TipePelanggan;
  nomorHp?: string;
  email?: string;
  alamat?: string;
}

export interface GetPelangganResponse {
  data: PelangganLama[];
}