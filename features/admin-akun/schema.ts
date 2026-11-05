import { z } from "zod";
import type { KunciPlan } from "@/types/langganan";

/** "percobaan" berarti durasiBulan tidak dikirim; angka mengikuti DURASI_LANGGANAN_BULAN backend. */
export const PILIHAN_DURASI = ["percobaan", "1", "3", "6", "12", "24"] as const;
export type PilihanDurasi = (typeof PILIHAN_DURASI)[number];

export const LABEL_DURASI: Record<PilihanDurasi, string> = {
  percobaan: "Masa percobaan",
  "1": "1 bulan",
  "3": "3 bulan",
  "6": "6 bulan",
  "12": "12 bulan",
  "24": "24 bulan",
};

export const PLAN_AKUN = ["basic", "advanced", "pro"] as const satisfies readonly KunciPlan[];

/** Masa gratis hanya untuk Basic (PL3a, B213). */
export const PESAN_PERCOBAAN_BASIC = "Masa percobaan hanya untuk plan Basic. Pilih durasi untuk Advanced atau Pro.";

/**
 * Aturan mengikuti validateBuatAkunKlien backend: email berformat sah,
 * password minimal 8 karakter dengan huruf kapital dan angka, dan username
 * opsional 3 sampai 25 karakter. Domain email disposable hanya diketahui
 * backend, sehingga penolakannya ditampilkan dari respons. Durasi kosong
 * terjadi saat plan berganti dari Basic bermasa percobaan (B213).
 */
export const objekAkunKlien = z.object({
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
  plan: z.enum(PLAN_AKUN),
  durasi: z.union([z.enum(PILIHAN_DURASI), z.literal("")]),
});

/** objekAkunKlien tetap tanpa refine agar dapat di-pick skema ubah akun. */
export const skemaBuatAkunKlien = objekAkunKlien.superRefine((nilai, ctx) => {
  if (nilai.durasi === "") {
    ctx.addIssue({ code: "custom", path: ["durasi"], message: "Pilih durasi langganan." });
  } else if (nilai.durasi === "percobaan" && nilai.plan !== "basic") {
    ctx.addIssue({ code: "custom", path: ["durasi"], message: PESAN_PERCOBAAN_BASIC });
  }
});

export type NilaiBuatAkunKlien = z.infer<typeof skemaBuatAkunKlien>;