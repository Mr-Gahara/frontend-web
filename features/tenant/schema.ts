import { z } from "zod";

/**
 * Skema form profil toko. Mengikuti validators/tenantValidator.js backend:
 * namaToko wajib dan minimal 3 karakter, emailBisnis berformat email bila
 * diisi, dan field lain teks bebas. Setiap isian dipangkas, sehingga nama
 * berisi spasi saja ditolak di form; backend menghitung panjang nama
 * sebelum memangkasnya.
 */

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const teksOpsional = z.string().trim();

export const skemaTenant = z.object({
  namaToko: z
    .string()
    .trim()
    .min(1, "Nama toko wajib diisi")
    .min(3, "Nama toko minimal 3 karakter"),
  alamat: teksOpsional,
  kota: teksOpsional,
  kodePos: teksOpsional,
  nomorTelepon: teksOpsional,
  emailBisnis: z
    .string()
    .trim()
    .refine((v): boolean => v === "" || POLA_EMAIL.test(v), "Format email tidak valid"),
  footerStruk: teksOpsional,
  idNPWP: teksOpsional,
});

export type NilaiFormTenant = z.infer<typeof skemaTenant>;