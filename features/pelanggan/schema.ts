import { z } from "zod";

/**
 * Skema form pelanggan, dipakai buat dan ubah. Setiap isian dipangkas,
 * sehingga nama berisi spasi saja ditolak di form. Email diperiksa bentuknya
 * bila diisi, sejalan dengan validators/pelangganValidator.js backend.
 */

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const skemaPelanggan = z.object({
  namaPelanggan: z.string().trim().min(1, "Nama pelanggan wajib diisi."),
  tipePelanggan: z.enum(["umum", "member", "korporat"]),
  nomorHp: z.string().trim(),
  email: z
    .string()
    .trim()
    .refine((v): boolean => v === "" || POLA_EMAIL.test(v), "Format email tidak valid."),
  alamat: z.string().trim(),
});

export type NilaiFormPelanggan = z.infer<typeof skemaPelanggan>;