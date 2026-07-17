export type SatuanBahan =
  | "kg"
  | "gram"
  | "liter"
  | "ml"
  | "pcs"
  | "pak"
  | "unit";

export interface BahanBaku {
  _id: string;
  tenantID: string;
  namaBahan: string;
  stok: number;
  minimalStok: number;
  satuan: SatuanBahan;
  availableUnits?: string[]; // Hasil dari getAvailableUnits backend
  createdAt: string;
  updatedAt: string;
}

export interface BahanBakuRequest {
  namaBahan: string;
  stok?: number;
  minimalStok?: number;
  satuan: SatuanBahan;
}
