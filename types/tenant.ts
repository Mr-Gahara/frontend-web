export type TenantStatus = "aktif" | "non-aktif";
export type TipePajak =
  | "Sudah Termasuk (Inclusive)"
  | "Belum Termasuk (Exclusive)";

export interface Tenant {
  _id: string;
  namaToko: string;
  status: TenantStatus;
  alamat: string | null;
  kota: string | null;
  kodePos: string | null;
  nomorTelepon: string | null;
  emailBisnis: string | null;
  logoUrl: string | null;
  footerStruk: string | null;
  idNPWP: string | null;
  persenPajak: number;
  tipePajak: TipePajak;
  isSetupComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BuatTokoRequest {
  namaToko: string;
}

export interface BuatTokoResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  data: Tenant;
}
