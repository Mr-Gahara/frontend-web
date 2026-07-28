export type StatusAset = "tersedia" | "digunakan" | "perbaikan";

export interface TipeAsetRelasi {
  id: string;
  namaTipeAset: string | null;
  deskripsi: string | null;
}

export interface Aset {
  id: string;
  tenantID: string | null;
  namaAset: string;
  dataAset: TipeAsetRelasi | null;
  status: StatusAset;
  createdAt: string;
  updatedAt: string;
}

export interface AsetPayload {
  namaAset: string;
  tipeAsetID: string;
  status?: "tersedia" | "perbaikan";
}
