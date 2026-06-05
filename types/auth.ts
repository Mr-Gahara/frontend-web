export type AkunRole = "client" | "admin";

export interface Akun {
  _id: string;
  username?: string;
  email: string;
  role: AkunRole;
  tenantID: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- Request / Response ---

export interface RegisterRequest {
  username?: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  data: Pick<Akun, "_id" | "email" | "role">;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TenantEntry {
  tenantID: string;
  namaToko: string;
}

export interface AkunSession {
  id: string;
  username: string | null;
  email: string;
  role: AkunRole;
  status: "aktif" | "non-aktif";
  daftarTenant: TenantEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  requireSetup: boolean;
  data: AkunSession;
}

export interface PenggunaSession {
  _id: string;
  nama: string;
  tenantID: string;
  role: {
    _id: string;
    nama: string;
    level: number;
  };
}

// Opsional: Jika backend punya endpoint login khusus untuk pengguna (Staff/Owner)
export interface LoginPenggunaResponse {
  message: string;
  accessToken: string;
  data: PenggunaSession;
}
