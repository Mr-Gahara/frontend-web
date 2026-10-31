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
  /** Kosong untuk akun admin (B136). */
  daftarTenant: TenantEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  /** false untuk akun admin (B136); admin dikenali dari data.role. */
  requireSetup: boolean;
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
