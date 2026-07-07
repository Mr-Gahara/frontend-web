// types/metodePembayaran.ts

import { AkunKasRef } from "./akunKas";

export type KategoriMetode = "tunai" | "non-tunai";

// Tipe untuk respons dari server (Data Utuh)
export interface MetodePembayaran {
  _id: string;
  namaPembayaran: string;
  kategori: KategoriMetode;
  isAutomated: boolean;
  xenditChannelCode?: string | null;
  isActive: boolean;
  akunKasID: AkunKasRef; // Hasil populate dari backend
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
export type GetMetodePembayaranResponse = MetodePembayaran[];