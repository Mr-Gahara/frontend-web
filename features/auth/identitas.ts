/**
 * Identitas di panel login pengguna (TP2b): nama toko dan email akun dari
 * GET /akun/me (B240). Selama belum termuat, gagal, atau nama toko kosong,
 * panel menampilkan merek Tachyon POS seperti TP2a.
 */

import type { AkunSaya } from "@/features/setup/api";

export const MEREK = "Tachyon POS";

export interface IdentitasPanel {
  judul: string;
  email: string | null;
}

export function identitasPanel(akun: AkunSaya | undefined): IdentitasPanel {
  const namaToko = akun?.daftarTenant?.[0]?.namaToko?.trim();
  if (!namaToko) return { judul: MEREK, email: null };
  return { judul: namaToko, email: akun?.email?.trim() || null };
}
