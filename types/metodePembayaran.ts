// types/metodePembayaran.ts

import { AkunKasRef } from "./akunKas";

export type KategoriMetode = "tunai" | "non-tunai";

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
 * Payload POST /metodepembayaran: tepat allowlist validator backend 465b438
 * (FIELD_DIIZINKAN), tanpa field gateway (kontrak/temuan.md butir 84,
 * keputusan PO4a).
 */
export interface MetodePembayaranBaru {
  namaPembayaran: string;
  akunKasID: string;
  kategori: KategoriMetode;
  isActive: boolean;
}

/** Payload PUT /metodepembayaran/:id: hanya field yang berubah (keputusan rancangan butir 15). */
export type PerubahanMetodePembayaran = Partial<MetodePembayaranBaru>;
