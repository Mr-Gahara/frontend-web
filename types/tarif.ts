export interface TipeAsetRef {
  id: string;
  namaTipeAset: string;
}

export interface Tarif {
  _id: string;
  id?: string;
  namaTarif: string;
  basisPerhitungan: "per jam" | "per sesi";
  harga: number;
  durasiMinimum: number;
  isActive: boolean;
  hariAktif: number[];
  jamMulai: string;
  jamSelesai: string;
  prioritas: number;
  tipeAsetID: TipeAsetRef[];
  tenantID: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TarifPayload {
  namaTarif: string;
  basisPerhitungan: "per jam" | "per sesi";
  harga: number;
  durasiMinimum: number;
  isActive?: boolean;
  hariAktif?: number[];
  jamMulai?: string;
  jamSelesai?: string;
  prioritas?: number;
  tipeAsetID?: string[]; // Array of strings (ObjectIds) untuk request ke backend
}
