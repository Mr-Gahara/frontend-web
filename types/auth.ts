export type DeviceType = "primary" | "secondary";
export type DeviceAction = "added" | "removed" | "promoted" | "demoted";
export type AkunRole = "client" | "admin";

export interface Device {
  deviceID: string;
  type: DeviceType;
  tokenVersion: number;
  lastUsed: string;
}

export interface DeviceHistory {
  deviceID: string;
  type: string;
  action: DeviceAction;
  timestamp: string;
}

export interface Akun {
  _id: string;
  username?: string;
  email: string;
  role: AkunRole;
  tenantID: string | null;
  device: Device[];
  maxPrimaryDevice: number;
  maxDevice: number;
  deviceHistory: DeviceHistory[];
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
  deviceID: string;
}

// Sesuai response aktual backend
export interface AkunSession {
  id: string;// bukan _id
  email: string;
  role: AkunRole;
  tenantID: string | null;
  currentDevice: string;
}

export interface LoginResponse {
  message: string;
  accessToken: string;
  data: AkunSession;
}