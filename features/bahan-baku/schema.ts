/**
 * Skema form bahan baku.
 *
 * Sebelumnya buat dan edit memiliki skema terpisah walau entitasnya sama.
 * Aturan satuan mengikuti VALID_UNITS di backend (bahanBakuValidator).
 */

import { z } from "zod";
import { SATUAN_BAHAN_OPTIONS } from "@/types/bahanBaku";

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
});

/**
 * Input dan output skema sengaja dijaga identik (tanpa coerce), agar
 * useForm cukup memakai satu parameter tipe dan resolver tidak bentrok.
 */
export type BahanBakuForm = z.infer<typeof bahanBakuSchema>;