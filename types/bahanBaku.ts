import { Entitas, Timestamps } from "./api";

// 1. Definisikan array nyatanya di sini
export const SATUAN_BAHAN_OPTIONS = ["kg", "gram", "liter", "ml", "pcs", "pak", "unit"] as const;

// 2. Ekstrak otomatis menjadi tipe (Tidak perlu tulis ulang manual!)
export type SatuanBahan = typeof SATUAN_BAHAN_OPTIONS[number];

/**
 * Respons GET /bahanbaku, sesuai docs/kontrak-api.md bagian 3.3.
 * Identitas sudah dinormalkan menjadi id oleh lib/api/normalize.ts.
 */
export interface BahanBaku extends Entitas, Timestamps {
  tenantID: string;
  namaBahan: string;
  satuan: SatuanBahan;
  /** Daftar satuan yang dapat dipakai pada resep, dihitung backend. */
  availableUnits?: string[];
}

/**
 * Payload POST dan PUT /bahanbaku, sesuai kontrak bagian 4.
 * Hanya namaBahan yang wajib; satuan dan stok dikenali validator.
 * tenantID diisi server dan tidak dikirim dari sini.
 */
export interface BahanBakuRequest {
  namaBahan: string;
  satuan: SatuanBahan;
  /** Stok awal, diinjeksi backend ke inventory saat bahan baku dibuat. */
  stok?: number;
  /**
   * Batas stok minimum entri inventory yang dibuat backend saat bahan baku
   * ditambahkan. Dibaca bahanBakuService, tidak diperiksa validator.
   */
  stokMinimum?: number;
  /**
   * Lokasi tujuan injeksi stok awal. Tidak diperiksa validator, tetapi
   * dibaca bahanBakuService: bila tidak dikirim, backend memakai lokasi
   * default tenant, sehingga stok bisa mendarat di lokasi yang keliru.
   */
  locationID?: string;
}

export interface BahanBakuComboboxProps {
  value: string;
  onChange: (val: string) => void;
  onSatuanChange: (satuan: string) => void;
  bahanBakuList: BahanBaku[];
  isLoading: boolean;
  hasError: boolean;
}
