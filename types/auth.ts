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
  /** Tidak dikirim untuk akun admin (respons nyata, 2 Oktober 2026). */
  daftarTenant?: TenantEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  /** Tidak dikirim untuk akun admin (respons nyata, 2 Oktober 2026). */
  requireSetup?: boolean;
  data: AkunSession;
}

/** Payload POST /pengguna/pin-login dari web; installationId hanya wajib untuk aplikasi. */
export interface PayloadLoginPengguna {
  nama: string;
  pin: string;
  loginType: "web";
}

/**
 * Respons POST /pengguna/pin-login. accessToken berada di tingkat atas.
 * success false dengan status 200 berarti perangkat menunggu persetujuan
 * (hanya login aplikasi).
 */
export interface ResponsLoginPengguna {
  success?: boolean;
  code?: string;
  message?: string;
  accessToken?: string;
}
