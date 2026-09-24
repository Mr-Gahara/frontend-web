// types/metodePembayaran.ts

import { AkunKasRef, AkunKasRefLama } from "./akunKas";

export type KategoriMetode = "tunai" | "non-tunai";

// Tipe untuk respons dari server (Data Utuh)
/**
 * Bentuk respons GET /metodepembayaran setelah dinormalkan, mengikuti
 * mappers/metodePembayaranMapper.js backend. Model backend tidak punya
 * isAutomated maupun xenditChannelCode, dan relasi akun kas dikirim sebagai
 * akunKas, bukan akunKasID.
 */
export interface MetodePembayaran {
  id: string;
  tenantID: string | null;
  akunKas: AkunKasRef | null;
  namaPembayaran: string;
  kategori: KategoriMetode;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bentuk lama yang dipakai halaman pengaturan metode pembayaran. Isinya
 * tidak sesuai respons (isAutomated, xenditChannelCode, akunKasID), dan
 * dihapus saat modulnya dimigrasikan (keputusan K8, modul penjualan).
 */
export interface MetodePembayaranLama {
  _id: string;
  namaPembayaran: string;
  kategori: KategoriMetode;
  isAutomated: boolean;
  xenditChannelCode?: string | null;
  isActive: boolean;
  akunKasID: AkunKasRefLama; // Hasil populate dari backend
  createdAt?: string;
  updatedAt?: string;
}

// Tipe payload untuk form Create & Update Metode Pembayaran
export interface MetodePembayaranRequest {
  namaPembayaran: string;
  kategori: KategoriMetode;
  akunKasID: string; 
  isAutomated?: boolean;
  xenditChannelCode?: string | null;
  isActive?: boolean;
}

// Opsional: Tipe untuk menampung respons array dari GET /metode-pembayaran
export type GetMetodePembayaranResponse = MetodePembayaranLama[];