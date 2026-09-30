// types/akunKas.ts

export type AkunKasTipe = "Kas Fisik" | "Rekening Bank";
export type AkunKasStatus = "aktif" | "non-aktif";

/**
 * Bentuk respons GET /akunkas setelah dinormalkan lib/api/client.ts
 * (kontrak/endpoint.md bagian 3.3).
 */
export interface AkunKas {
  id: string;
  tenantID: string;
  namaAkun: string;
  nomorAkun: string;
  saldo: number;
  tipeAkun: AkunKasTipe;
  status: AkunKasStatus;
  keterangan: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Ringkasan akun kas di dalam respons metode pembayaran (mapper backend). */
export interface AkunKasRef {
  id: string;
  namaAkun: string | null;
  nomorAkun: string | null;
}

// Tipe payload untuk form Create & Update Akun Kas
export interface AkunKasRequest {
  namaAkun: string;
  nomorAkun: string;
  tipeAkun: AkunKasTipe;
  saldo?: number; // Opsional saat update
  status?: AkunKasStatus;
  keterangan?: string;
}
