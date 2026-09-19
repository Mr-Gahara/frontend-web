import { Entitas } from "./api";

/**
 * Respons GET /permission. Identitas sudah dinormalkan menjadi id
 * oleh lib/api/normalize.ts.
 */
export interface Permission extends Entitas {
  nama: string;
  grup: string;
  deskripsi?: string;
}

export interface PermissionGrouped {
  [grup: string]: Permission[];
}

export interface BuatRoleRequest {
  namaRole: string;
  deskripsi?: string;
  level: number;
  /** Daftar id permission. */
  permissions: string[];
}

export interface BuatRoleResponse {
  message: string;
  data: {
    id: string;
    namaRole: string;
    deskripsi: string | null;
    level: number;
    permissions: string[]; // array of permission nama
  };
}

/** Respons GET /role, sesuai docs/kontrak-api.md bagian 3.3. */
export interface Role extends Entitas {
  namaRole: string;
  deskripsi: string | null;
  level: number;
  permissions: string[];
}

export interface GetRolesResponse {
  message: string;
  total: number;
  data: Role[];
}

export interface GetPermissionsResponse {
  message: string;
  data: Permission[];
}

export interface GetRoleDetailResponse {
  message: string;
  data: Role;
}