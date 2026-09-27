import { z } from "zod";

/*
 * Satu skema untuk buat dan edit. Halaman buat hanya menawarkan "tersedia"
 * dan "perbaikan"; "digunakan" dapat terbaca di edit karena status itu
 * dihitung backend dari sesi booking yang sedang berjalan.
 */
export const skemaAset = z.object({
  namaAset: z.string().trim().min(1, "Nama aset wajib diisi"),
  tipeAsetID: z.string().min(1, "Kategori / Tipe aset wajib dipilih"),
  status: z.enum(["tersedia", "perbaikan", "digunakan"]),
});

export type NilaiFormAset = z.infer<typeof skemaAset>;