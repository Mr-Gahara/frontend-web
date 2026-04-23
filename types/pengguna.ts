// --- Sub-types ---

export interface Pengguna {
  _id: string;
  nama: string;
  tenantID: string;
  roleID: string;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
}

// --- Request / Response ---

export interface RegisterOwnerRequest {
  nama: string;
  pin: string;
}

export interface RegisterOwnerResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  data: {
    _id: string;
    nama: string;
    role: string;
  };
}

export interface PinLoginRequest {
  nama: string;
  pin: string;
}

export interface PinLoginResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  data: {
    nama: string;
    role: string;
  };
}

// JWT payload setelah decode penggunaToken
export interface PenggunaSession {
  id: string;
  tenantID: string;
  roleID: string;
  version: number;
}