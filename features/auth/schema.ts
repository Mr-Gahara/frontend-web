import { z } from "zod";

/**
 * Skema form login. Mengikuti validator backend: login akun menuntut email
 * berformat sah dan password terisi (validators/akunValidator.js); login
 * pengguna menuntut nama dan PIN terisi (validators/penggunaValidator.js).
 * Panjang PIN tidak dipaksakan di sini: aturan tepat 6 digit ditegakkan
 * saat PIN dibuat atau diubah, sedangkan PIN yang salah diputuskan backend.
 */
const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const skemaLoginAkun = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi")
    .refine((v): boolean => v === "" || POLA_EMAIL.test(v), "Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type NilaiLoginAkun = z.infer<typeof skemaLoginAkun>;

export const skemaLoginPengguna = z.object({
  nama: z.string().trim().min(1, "Nama pengguna wajib diisi"),
  pin: z
    .string()
    .min(1, "PIN wajib diisi")
    .refine((v): boolean => v === "" || /^\d+$/.test(v), "PIN hanya boleh berisi angka"),
});

export type NilaiLoginPengguna = z.infer<typeof skemaLoginPengguna>;