export type TenantStatus = "aktif" | "non-aktif";

/** Satu hari jam operasional (utils/jamOperasional.js backend, P81, B331). */
export type JamHariTenant =
  | { status: "buka"; jamBuka: string; jamTutup: string }
  | { status: "24jam" | "libur"; jamBuka: null; jamTutup: null };

/**
 * Jam operasional toko per hari (P81, B331): buka 24 jam, atau tujuh hari
 * Senin sampai Minggu. Jam HH:mm WIB; tutup lebih kecil dari buka berarti
 * keesokan harinya. null di tenant berarti belum diatur.
 */
export type JamOperasional = { mode: "24jam"; hari: null } | { mode: "tertentu"; hari: JamHariTenant[] };

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
  jamOperasional: JamOperasional | null;
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
  /** Diganti utuh; null menghapusnya (belum diatur). */
  jamOperasional?: JamOperasional | null;
}
