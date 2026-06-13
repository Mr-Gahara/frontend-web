// types/pelanggan.ts

export type TipePelanggan = "umum" | "member" | "korporat";

export interface Pelanggan {
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
  data: Pelanggan[];
}