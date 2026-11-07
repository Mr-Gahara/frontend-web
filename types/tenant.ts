export type TenantStatus = "aktif" | "non-aktif";

/**
 * Bentuk GET /tenant/:id (mappers/tenantMapper.js backend). persenPajak dan
 * tipePajak dibuang backend di a949910 (B266); pajak toko hanya lewat /pajak.
 */
export interface Tenant {
  id: string;
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
  isSetupComplete: boolean;
  absensiLokasiAktif: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Field profil toko yang diubah web lewat PUT /tenant/:id (keputusan
 * PO13a: logoUrl dan isSetupComplete tidak dikirim). Seluruhnya opsional, karena hanya field yang berubah yang
 * dikirim.
 */
export interface PerbaruiTenantPayload {
  namaToko?: string;
  alamat?: string;
  kota?: string;
  kodePos?: string;
  nomorTelepon?: string;
  emailBisnis?: string;
  footerStruk?: string;
  idNPWP?: string;
}
