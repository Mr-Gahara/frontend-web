import type { NilaiFormTipeAset } from "./schema";
import type { TipeAsetPayload } from "@/types/tipeAset";

/** Tipe aset baru tanpa deskripsi tidak perlu mengirim field itu. */
export function payloadBuatTipeAset(nilai: NilaiFormTipeAset): TipeAsetPayload {
  const namaTipeAset = nilai.namaTipeAset.trim();
  const deskripsi = nilai.deskripsi.trim();
  return deskripsi ? { namaTipeAset, deskripsi } : { namaTipeAset };
}

/**
 * Deskripsi yang dikosongkan dikirim "" agar terhapus: backend meneruskan
 * payload utuh ke findOneAndUpdate, sehingga field yang tidak dikirim
 * mempertahankan nilai lama (a2adc70).
 */
export function payloadUbahTipeAset(nilai: NilaiFormTipeAset): TipeAsetPayload {
  return { namaTipeAset: nilai.namaTipeAset.trim(), deskripsi: nilai.deskripsi.trim() };
}