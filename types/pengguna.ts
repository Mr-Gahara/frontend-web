
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
  /** Nama peran dalam teks, dikirim GET /pengguna di samping roleID (kontrak/endpoint.md). */
  role?: string;
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
/**
 * Respons GET dan PUT /pengguna/:id, sesuai mappers/penggunaMapper.js
 * backend: tanpa timestamps, tenantID, maupun tokenVersion, dengan roleID
 * berupa id dan role berupa nama peran.
 */
export interface PenggunaDetail extends Entitas {
  nama: string;
  nomorHp: string | null;
  status: "aktif" | "non-aktif";
  fotoKaryawan: string | null;
  aksesType: ("app" | "web")[];
  roleID: string | null;
  role: string | null;
}

/**
 * Payload ubah profil sendiri lewat PUT /pengguna/:id. Seluruh field
 * opsional di validator mode update; nomorHp null mengosongkan nomor, dan
 * PIN diubah lewat pasangan pinLama dan pinBaru.
 */
export interface PerbaruiProfilPayload {
  nama?: string;
  nomorHp?: string | null;
  pinLama?: string;
  pinBaru?: string;
}
