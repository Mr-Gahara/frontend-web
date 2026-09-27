import { z } from "zod";

/*
 * Satu skema untuk buat dan edit. Sebutan di pesan sengaja dipertahankan
 * seperti halaman lama: halaman buat menyebutnya "Kategori Aset", halaman
 * edit "Tipe Aset". Penyeragaman sebutan menunggu keputusan produk.
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

export const skemaBuatTipeAset = skemaDengan("Kategori Aset");
export const skemaUbahTipeAset = skemaDengan("Tipe Aset");

export type NilaiFormTipeAset = z.infer<typeof skemaBuatTipeAset>;