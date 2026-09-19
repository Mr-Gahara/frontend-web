
import { Entitas, Timestamps } from "./api";
import { Role } from "./role";

export interface PenggunaRole extends Entitas {
  namaRole: string;
}

/**
 * Respons GET /pengguna, sesuai docs/kontrak-api.md bagian 3.3.
 * Identitas sudah dinormalkan menjadi id oleh lib/api/normalize.ts.
 */
export interface PenggunaItem extends Entitas, Timestamps {
  nama: string;
  nomorHp?: string;
  status: "aktif" | "non-aktif";
  aksesType: ("app" | "web")[];
  fotoKaryawan?: string | null;
  tenantID: string;
  /** Backend mengirim string atau objek hasil populate, tergantung endpoint. */
  roleID: string | Role;
  tokenVersion: number;
}

export interface PenggunaRequest {
  nama: string;
  pin?: string;             // Digunakan HANYA untuk Create/Pembuatan Staf baru
  pinLama?: string;         // Tambahan: Untuk Update PIN mandiri
  pinBaru?: string;         // Tambahan: Untuk Update PIN mandiri
  nomorHp?: string;
  roleID: string;
  status: "aktif" | "non-aktif";
  aksesType: ("app" | "web")[]; // PERUBAHAN: Tanda '?' dihapus karena sekarang wajib
}

export interface GetPenggunaResponse {
  message: string;
  data: PenggunaItem[];
}

export interface PenggunaResponse {
  message: string;
  data: PenggunaItem;
}