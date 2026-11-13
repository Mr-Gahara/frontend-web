import { z } from "zod";
import { aturanPassword } from "@/features/auth/schema";

/** Kode OTP sah: tepat 6 digit angka (POLA_OTP backend). */
export const kodeLengkap = (kotak: readonly string[]) => /^\d{6}$/.test(kotak.join(""));

/** Ubah email tahap 1: email baru berformat sah dan berbeda dari email saat ini. */
export const skemaEmailBaru = (emailSaatIni: string) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, "Email baru wajib diisi")
      .email("Format email tidak valid")
      .refine((v) => v.toLowerCase() !== emailSaatIni.trim().toLowerCase(), "Email baru sama dengan email saat ini"),
  });
export type NilaiEmailBaru = z.infer<ReturnType<typeof skemaEmailBaru>>;

/** Ubah password tahap 1: aturan password baru sama dengan daftar dan validator backend. */
export const skemaPasswordAkun = z
  .object({
    passwordLama: z.string().min(1, "Password lama wajib diisi"),
    password: aturanPassword,
    ulangiPassword: z.string().min(1, "Ulangi password wajib diisi"),
  })
  .refine((n) => n.password === n.ulangiPassword, { path: ["ulangiPassword"], message: "Password tidak sama" });
export type NilaiPasswordAkun = z.infer<typeof skemaPasswordAkun>;
