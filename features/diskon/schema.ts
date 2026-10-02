import { z } from "zod";

/**
 * Skema form diskon untuk enam field dasar, dipakai buat dan ubah.
 * Mengikuti validators/diskonValidator.js backend: nama wajib dan paling
 * banyak 100 karakter, nilai angka lebih dari 0, dan persen paling banyak
 * 100. Nilai disimpan sebagai teks agar isian kosong tetap tampil kosong.
 */
export const skemaDiskon = z
  .object({
    namaDiskon: z
      .string()
      .trim()
      .min(1, "Nama diskon wajib diisi.")
      .max(100, "Nama diskon paling banyak 100 karakter."),
    cakupan: z.enum(["Global", "Item"]),
    tipe: z.enum(["persen", "nominal"]),
    nilai: z.string().trim(),
    bisaDigabung: z.boolean(),
    status: z.enum(["Aktif", "Non-Aktif"]),
  })
  .superRefine((nilai, ctx) => {
    const angka = Number(nilai.nilai);
    if (nilai.nilai === "" || !Number.isFinite(angka) || angka <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["nilai"],
        message: "Nilai potongan wajib berupa angka lebih dari 0.",
      });
    } else if (nilai.tipe === "persen" && angka > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["nilai"],
        message: "Nilai diskon persen tidak boleh melebihi 100.",
      });
    }
  });

export type NilaiFormDiskon = z.infer<typeof skemaDiskon>;