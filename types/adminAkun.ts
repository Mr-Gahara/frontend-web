import type { AkunRole, TenantEntry } from "./auth";

export type StatusAkun = "aktif" | "non-aktif";
export type AlasanNonAktif = "manual" | "kedaluwarsa";
export type DurasiLangganan = 1 | 3 | 6 | 12;

export interface LanggananAkun {
  /** null berarti masa akses tidak dibatasi (akun lama, atau akun admin). */
  aksesBerakhirPada: string | null;
  alasanNonAktif: AlasanNonAktif | null;
  dibekukanPada: string | null;
  masaTenggangHari: number | null;
}

/**
 * Item GET /akun/admin/all dan respons POST /akun/admin/users
 * (mappers/akunMapper.js backend dengan sertakanLangganan).
 */
export interface AkunAdmin {
  id: string;
  username: string | null;
  email: string;
  role: AkunRole;
  status: StatusAkun;
  daftarTenant: TenantEntry[];
  createdAt: string;
  updatedAt: string;
  langganan: LanggananAkun;
}

/** Allowlist validateBuatAkunKlien: tanpa durasiBulan berarti masa percobaan. */
export interface BuatAkunKlienPayload {
  email: string;
  password: string;
  username?: string;
  durasiBulan?: DurasiLangganan;
}