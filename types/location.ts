// types/location.ts

export type TipeLokasi = "Outlet" | "Gudang";

export interface KoordinatLokasi {
  type: "Point";
  coordinates: [number, number]; // Selalu [longitude, latitude]
}

export interface Lokasi {
  _id: string;
  nama: string;
  tipe: TipeLokasi;
  alamat: string;
  koordinat: KoordinatLokasi;
  radiusAbsen: number;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}

// Response dari endpoint GET /lokasi biasanya dibungkus array di dalam 'data'
export interface LokasiListResponse {
  success: boolean;
  data: Lokasi[];
}