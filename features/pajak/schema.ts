import * as z from "zod";

/**
 * Skema form buat dan ubah pajak (keputusan PO8a). Tarif dan prioritas
 * disimpan sebagai teks isian; payload.ts mengubahnya menjadi angka setelah
 * lolos skema, tanpa z.coerce (cara-kerja.md, Catatan form).
 * - Nama dipangkas, sehingga isian berisi spasi saja ditolak (sejalan KU7a).
 * - Tarif kosong ditolak (sejalan T3b), sedangkan 0 yang diketik sah.
 *   Rentang 0 sampai 100 sama dengan validatePajakPayload backend.
 * - Prioritas hanya 1 atau 2 (VALID_PRIORITAS); nilai lain dari data lama
 *   menjadi isian kosong yang wajib dipilih ulang (nilaiAwalPajak).
 */
export const skemaPajak = z.object({
  namaPajak: z.string().trim().min(1, "Nama Pajak wajib diisi."),
  tarifPajak: z.string().superRefine((v, ctx) => {
    const t = v.trim();
    if (t === "") {
      ctx.addIssue({ code: "custom", message: "Tarif wajib diisi." });
      return;
    }
    const n = Number(t);
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: "custom", message: "Tarif harus berupa angka." });
    } else if (n < 0 || n > 100) {
      ctx.addIssue({ code: "custom", message: "Tarif harus antara 0 sampai 100." });
    }
  }),
  tipePajak: z.boolean(),
  modelPerhitungan: z.enum(["1", "2", "3"]),
  // Anotasi boolean mencegah TypeScript menyimpulkan predikat tipe, sehingga isian tetap string
  // dan nilaiAwalPajak boleh berisi "" untuk prioritas di luar 1 atau 2.
  prioritas: z.string().refine((v): boolean => v === "1" || v === "2", { error: "Prioritas wajib dipilih." }),
  statusPajak: z.boolean(),
});

export type NilaiPajak = z.infer<typeof skemaPajak>;