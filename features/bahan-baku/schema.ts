/**
 * Skema form bahan baku.
 *
 * Sebelumnya buat dan edit memiliki skema terpisah walau entitasnya sama.
 * Aturan satuan mengikuti VALID_UNITS di backend (bahanBakuValidator).
 */

import { z } from "zod";
import { SATUAN_BAHAN_OPTIONS } from "@/types/bahanBaku";

/** Batas dan pola konversi kemasan sesuai validator backend (B359). */
export const BATAS_KEMASAN = 10;
const POLA_SATUAN_KEMASAN = /^[a-z0-9 ]{1,20}$/;
/** Satuan bawaan yang tidak boleh menjadi nama kemasan. */
const SATUAN_BAWAAN = ["kg", "gram", "liter", "ml"];

export const bahanBakuSchema = z.object({
  namaBahan: z
    .string()
    .trim()
    .min(1, "Nama bahan baku wajib diisi.")
    .max(100, "Nama bahan baku maksimal 100 karakter."),
  satuan: z.enum(SATUAN_BAHAN_OPTIONS, {
    message: "Satuan tidak dikenali.",
  }),
  /** Stok awal hanya relevan saat membuat; backend menginjeksinya ke inventory. */
  stok: z.number().min(0, "Stok tidak boleh negatif.").optional(),
  /**
   * Batas stok minimum untuk entri inventory yang dibuat backend.
   * Nama field mengikuti bahanBakuService, yang membaca stokMinimum.
   * Form sebelumnya mengirim minimalStok, sehingga nilainya tidak pernah
   * tersimpan dan setiap bahan baku baru selalu berbatas minimum 0.
   */
  stokMinimum: z
    .number()
    .min(0, "Batas stok minimum tidak boleh negatif.")
    .optional(),
  /**
   * Kemasan bahan (backend P87, B359): isi dalam satuan dasar, misalnya
   * kaleng = 290 ml. PUT mengganti seluruh daftar.
   */
  konversi: z
    .array(
      z.object({
        satuan: z
          .string()
          .trim()
          .toLowerCase()
          .regex(POLA_SATUAN_KEMASAN, "Nama kemasan 1-20 huruf kecil, angka, atau spasi."),
        isi: z.number({ message: "Isi wajib angka." }).gt(0, "Isi wajib lebih dari 0."),
      }),
    )
    .max(BATAS_KEMASAN, `Kemasan paling banyak ${BATAS_KEMASAN}.`)
    .optional(),
}).superRefine((nilai, ctx) => {
  const terlihat = new Set<string>();
  (nilai.konversi ?? []).forEach((k, i) => {
    const nama = k.satuan.trim().toLowerCase();
    if (nama === nilai.satuan || SATUAN_BAWAAN.includes(nama)) {
      ctx.addIssue({ code: "custom", path: ["konversi", i, "satuan"], message: "Sudah satuan bawaan atau satuan dasar." });
    } else if (terlihat.has(nama)) {
      ctx.addIssue({ code: "custom", path: ["konversi", i, "satuan"], message: "Nama kemasan ganda." });
    }
    terlihat.add(nama);
  });
});

/**
 * Input dan output skema sengaja dijaga identik (tanpa coerce), agar
 * useForm cukup memakai satu parameter tipe dan resolver tidak bentrok.
 */
export type BahanBakuForm = z.infer<typeof bahanBakuSchema>;
export type KemasanForm = NonNullable<BahanBakuForm["konversi"]>[number];