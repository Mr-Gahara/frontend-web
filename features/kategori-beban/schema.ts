import * as z from "zod";

/**
 * Skema tambah dan ganti nama kategori beban. Nama dipangkas dan wajib;
 * batas 100 karakter mengikuti nama diskon, karena backend belum membatasi
 * panjangnya. Keunikan per toko diperiksa backend.
 */
export const skemaKategoriBeban = z.object({
  namaKategori: z
    .string()
    .trim()
    .min(1, "Nama kategori wajib diisi.")
    .max(100, "Nama kategori maksimal 100 karakter."),
});

export type IsianKategoriBeban = z.infer<typeof skemaKategoriBeban>;