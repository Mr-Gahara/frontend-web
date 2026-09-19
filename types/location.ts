import { Entitas, Timestamps } from "./api";

// types/location.ts

export type TipeLokasi = "Outlet" | "Gudang";

export interface KoordinatLokasi {
  type: "Point";
  coordinates: [number, number]; // Selalu [longitude, latitude]
}

/**
 * Respons GET /location, sesuai docs/kontrak-api.md bagian 3.3.
 * Identitas sudah dinormalkan menjadi id oleh lib/api/normalize.ts.
 */
export interface Lokasi extends Entitas, Timestamps {
  nama: string;
  tipe: TipeLokasi;
  alamat: string;
  koordinat: KoordinatLokasi;
  radiusAbsen: number;
  tenantID: string;
}

// Response dari endpoint GET /lokasi biasanya dibungkus array di dalam 'data'
export interface LokasiListResponse {
  success: boolean;
  data: Lokasi[];
}