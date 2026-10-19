import * as z from "zod";

const keterangan = z
  .string()
  .trim()
  .min(1, "Keterangan wajib diisi.")
  .max(500, "Keterangan maksimal 500 karakter.");

/**
 * Skema form catat beban (keputusan BO3a dan BO5a). Jumlah disimpan sebagai
 * teks agar isian kosong tetap kosong; yang sah hanya bilangan bulat minimal
 * 1, sesuai validator backend. Tanggal berupa YYYY-MM-DD hari lokal dan tidak
 * boleh melewati hari ini, dan keterangan paling panjang 500; keduanya sama
 * dengan validator backend sejak B100 (kontrak/temuan.md butir 137).
 */
export function buatSkemaCatatBeban(hariIni: string) {
  return z.object({
    akunKasID: z.string().min(1, "Akun kas wajib dipilih."),
    kategoriBebanID: z.string().min(1, "Kategori wajib dipilih."),
    jumlah: z
      .string()
      .trim()
      .min(1, "Jumlah wajib diisi.")
      .refine(
        (v): boolean => /^\d+$/.test(v) && Number(v) >= 1,
        "Jumlah harus bilangan bulat minimal 1.",
      ),
    tanggal: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi.")
      .refine((v): boolean => v <= hariIni, "Tanggal tidak boleh melewati hari ini."),
    keterangan,
  });
}

export type IsianCatatBeban = z.infer<ReturnType<typeof buatSkemaCatatBeban>>;

/** Skema ubah beban (keputusan BO6a): hanya keterangan dan kategori. */
export const skemaUbahBeban = z.object({
  kategoriBebanID: z.string().min(1, "Kategori wajib dipilih."),
  keterangan,
});

export type IsianUbahBeban = z.infer<typeof skemaUbahBeban>;