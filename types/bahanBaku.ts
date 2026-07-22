// 1. Definisikan array nyatanya di sini
export const SATUAN_BAHAN_OPTIONS = ["kg", "gram", "liter", "ml", "pcs", "pak", "unit"] as const;

// 2. Ekstrak otomatis menjadi tipe (Tidak perlu tulis ulang manual!)
export type SatuanBahan = typeof SATUAN_BAHAN_OPTIONS[number];

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
