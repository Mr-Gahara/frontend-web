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
  level: number;
  permissions: string[]; // array of permission _id
}

export interface BuatRoleResponse {
  message: string;
  data: {
    _id: string;
    namaRole: string;
    deskripsi: string | null;
    level: number;
    permissions: string[]; // array of permission nama
  };
}

export interface Role {
  _id: string;
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