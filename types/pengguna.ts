
import { Role } from "./role";
export interface PenggunaRole {
  _id: string;
  namaRole: string;
}

export interface PenggunaItem {
  _id: string;
  nama: string;
  nomorHp?: string;
  status: "aktif" | "non-aktif";
  aksesType: ("app" | "web")[];
  fotoKaryawan?: string | null;
  tenantID: string;
  // backend bisa return string ATAU object populate
  roleID: string | Role;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
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