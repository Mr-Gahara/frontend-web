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

/**
 * Skema daftar akun. Aturan password sama dengan validateRegister backend
 * (minimal 8 karakter, huruf kapital, dan angka), supaya kesalahan tertangkap
 * sebelum dikirim. ulangiPassword hanya diperiksa di klien.
 */
export const skemaDaftarAkun = z
  .object({
    email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid"),
    password: z
      .string()
      .min(1, "Password wajib diisi")
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung minimal 1 huruf kapital")
      .regex(/[0-9]/, "Password harus mengandung minimal 1 angka"),
    ulangiPassword: z.string().min(1, "Ulangi password wajib diisi"),
  })
  .refine((n) => n.password === n.ulangiPassword, {
    path: ["ulangiPassword"],
    message: "Password tidak sama",
  });

export type NilaiDaftarAkun = z.infer<typeof skemaDaftarAkun>;