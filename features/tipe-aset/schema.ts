import { z } from "zod";

/*
 * Satu skema untuk buat dan edit. Sebutan di laman reservasi diseragamkan
 * menjadi "Kategori Aset" (pemilik proyek, 23 November 2026); nama kode
 * dan rute tetap tipe aset.
 */
function skemaDengan(sebutan: string) {
  return z.object({
    namaTipeAset: z
      .string()
      .trim()
      .min(1, "Nama " + sebutan + " wajib diisi")
      .min(2, "Nama " + sebutan + " minimal 2 karakter"),
    deskripsi: z.string().trim(),
  });
}

export const skemaTipeAset = skemaDengan("Kategori Aset");
export const skemaBuatTipeAset = skemaTipeAset;
export const skemaUbahTipeAset = skemaTipeAset;

export type NilaiFormTipeAset = z.infer<typeof skemaBuatTipeAset>;