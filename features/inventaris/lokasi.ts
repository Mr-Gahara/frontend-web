import type { Lokasi } from "@/types/location";

/**
 * Menyeragamkan isi respons atau cache lokasi aktif menjadi satu lokasi.
 *
 * Halaman lama yang memakai kunci cache yang sama lewat apiClient dapat
 * menyimpan bentuk mentahnya, berupa objek atau array.
 */
export function lokasiTunggal(data: unknown): Lokasi | null {
  const kandidat: unknown = Array.isArray(data) ? data[0] : data;
  if (kandidat && typeof kandidat === "object" && "id" in kandidat) {
    return kandidat as Lokasi;
  }
  return null;
}