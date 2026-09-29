import { Entitas, Timestamps } from "./api";

// types/location.ts

export type TipeLokasi = "Outlet" | "Gudang";

export interface KoordinatLokasi {
  type: "Point";
  coordinates: [number, number]; // Selalu [longitude, latitude]
}

/**
 * Respons GET /location, sesuai docs/kontrak/endpoint.md bagian 3.3.
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

/**
 * Payload POST /location. Sesuai DIIZINKAN_BUAT di
 * validators/locationValidator.js backend: tipe wajib, koordinat wajib
 * angka sungguhan, dan radiusAbsen opsional 10 sampai 50 (bawaan model 50).
 * tenantID diisi server dari sesi.
 */
export interface BuatLokasiPayload {
  nama: string;
  tipe: TipeLokasi;
  alamat: string;
  latitude: number;
  longitude: number;
  radiusAbsen?: number;
}

/**
 * Payload PUT /location/:id: field buat tanpa tipe, karena validator update
 * backend hanya menerima nama, alamat, latitude, longitude, dan radiusAbsen,
 * dan menolak tipe maupun tenantID.
 */
export type PerbaruiLokasiPayload = Omit<BuatLokasiPayload, "tipe">;