import type { NilaiFormAset } from "./schema";
import type { AsetPayload } from "@/types/aset";

/**
 * Status "digunakan" tidak dikirim: status itu dihitung backend dari sesi
 * booking, dan backend mengganti "digunakan" yang dikirim menjadi "tersedia".
 */
export function payloadAset(nilai: NilaiFormAset): AsetPayload {
  const dasar = { namaAset: nilai.namaAset.trim(), tipeAsetID: nilai.tipeAsetID };
  return nilai.status === "digunakan" ? dasar : { ...dasar, status: nilai.status };
}