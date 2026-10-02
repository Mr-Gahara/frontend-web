import { z } from "zod";

/** "percobaan" berarti durasiBulan tidak dikirim; angka mengikuti DURASI_LANGGANAN_BULAN backend. */
export const PILIHAN_DURASI = ["percobaan", "1", "3", "6", "12"] as const;
export type PilihanDurasi = (typeof PILIHAN_DURASI)[number];

export const LABEL_DURASI: Record<PilihanDurasi, string> = {
  percobaan: "Masa percobaan",
  "1": "1 bulan",
  "3": "3 bulan",
  "6": "6 bulan",
  "12": "12 bulan",
};

/**
 * Aturan mengikuti validateBuatAkunKlien backend: email berformat sah,
 * password minimal 8 karakter dengan huruf kapital dan angka, dan username
 * opsional 3 sampai 25 karakter. Domain email disposable hanya diketahui
 * backend, sehingga penolakannya ditampilkan dari respons.
 */
export const skemaBuatAkunKlien = z.object({
  email: z.string().trim().min(1, "Email wajib diisi.").email("Format email tidak valid."),
  username: z
    .string()
    .trim()
    .refine(
      (v): boolean => v === "" || (v.length >= 3 && v.length <= 25),
      "Username 3 sampai 25 karakter, atau kosongkan.",
    ),
  password: z
    .string()
    .min(1, "Password wajib diisi.")
    .min(8, "Password minimal 8 karakter.")
    .regex(/[A-Z]/, "Password harus mengandung huruf kapital.")
    .regex(/[0-9]/, "Password harus mengandung angka."),
  durasi: z.enum(PILIHAN_DURASI),
});

export type NilaiBuatAkunKlien = z.infer<typeof skemaBuatAkunKlien>;