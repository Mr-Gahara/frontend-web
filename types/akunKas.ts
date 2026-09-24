// types/akunKas.ts

export type AkunKasTipe = "Kas Fisik" | "Rekening Bank";
export type AkunKasStatus = "aktif" | "non-aktif";

// Tipe untuk respons dari server (Data Utuh)
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

/**
 * Bentuk mentah untuk halaman yang belum dimigrasikan dan masih membaca
 * respons lewat lib/apiClient.ts. Dihapus bersama AkunKasRefLama saat modul
 * keuangan dan metode pembayaran dimigrasikan (keputusan K8, modul
 * penjualan).
 */
export interface AkunKasLama {
  _id: string;
  id?: string;
  namaAkun: string;
  saldo: number;
  tipeAkun: AkunKasTipe;
  status: AkunKasStatus;
  nomorAkun: string;
  keterangan: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Tipe khusus untuk referensi lookup hasil populate (.populate("akunKasID", "namaAkun nomorAkun"))
/** Ringkasan akun kas di dalam respons metode pembayaran (mapper backend). */
export interface AkunKasRef {
  id: string;
  namaAkun: string | null;
  nomorAkun: string | null;
}

export interface AkunKasRefLama {
  _id: string;
  namaAkun: string;
  nomorAkun: string;
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