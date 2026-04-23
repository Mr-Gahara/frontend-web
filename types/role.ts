export interface Permission {
  _id: string;
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
  permissions: string[]; // array of permission _id
}

export interface BuatRoleResponse {
  message: string;
  data: {
    _id: string;
    namaRole: string;
    deskripsi: string | null;
    permissions: string[]; // array of permission nama
  };
}

export interface Role {
  _id: string;
  namaRole: string;
  deskripsi: string | null;
  permissions: string[];
}

export interface GetRolesResponse {
  message: string;
  total: number;
  data: Role[];
}