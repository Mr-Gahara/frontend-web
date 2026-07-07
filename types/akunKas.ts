// types/akunKas.ts

export type AkunKasTipe = "Kas Fisik" | "Rekening Bank";
export type AkunKasStatus = "aktif" | "non-aktif";

// Tipe untuk respons dari server (Data Utuh)
export interface AkunKas {
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
export interface AkunKasRef {
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