import * as z from "zod";

/**
 * Skema form Pindah Dana. Jumlah disimpan sebagai teks agar isian kosong
 * tetap kosong; yang sah hanya bilangan bulat minimal 1, sesuai model backend
 * (min 1). Keterangan wajib dan paling panjang 500 setelah dipangkas, sesuai
 * validator backend.
 */
export const skemaPindahDana = z
  .object({
    kasSumberID: z.string().min(1, "Akun sumber wajib dipilih."),
    kasTujuanID: z.string().min(1, "Akun tujuan wajib dipilih."),
    jumlah: z
      .string()
      .trim()
      .min(1, "Jumlah wajib diisi.")
      .refine(
        (v): boolean => /^\d+$/.test(v) && Number(v) >= 1,
        "Jumlah harus bilangan bulat minimal 1.",
      ),
    keterangan: z
      .string()
      .trim()
      .min(1, "Keterangan wajib diisi.")
      .max(500, "Keterangan maksimal 500 karakter."),
  })
  .refine((v): boolean => v.kasSumberID === "" || v.kasSumberID !== v.kasTujuanID, {
    path: ["kasTujuanID"],
    message: "Akun tujuan harus berbeda dari akun sumber.",
  });

export type IsianPindahDana = z.infer<typeof skemaPindahDana>;