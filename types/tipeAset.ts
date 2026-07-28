export interface TarifAsetTerkait {
  id: string;
  namaTarif: string;
  harga: number;
  durasiMinimum: number;
}

export interface TipeAset {
  id: string;
  _id?: string; // Fallback jika ID asli masih terbawa
  tenantID: string;
  namaTipeAset: string;
  deskripsi: string | null;
  dataTarif: TarifAsetTerkait[];
  createdAt: string;
  updatedAt: string;
}

export interface TipeAsetPayload {
  namaTipeAset: string;
  deskripsi?: string;
}

export interface GetTipeAsetListResponse {
  data: TipeAset[];
}

export interface GetTipeAsetResponse {
  data: TipeAset;
}