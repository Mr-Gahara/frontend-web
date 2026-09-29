import * as z from "zod";

/**
 * Skema form jadwal manual (keputusan JD8a). Karyawan dan tanggal wajib
 * saat buat lewat Tambah Manual; saat dibuka dari sel keduanya sudah terisi.
 * Hari kerja wajib minimal satu shift, dan shift itu harus masih aktif,
 * karena backend menolak shift nonaktif (JD7).
 */
export function buatSkemaJadwalManual(idShiftAktif: ReadonlySet<string>) {
  return z
    .object({
      penggunaId: z.string(),
      tanggal: z.date().optional(),
      status: z.enum(["kerja", "libur"]),
      shiftIds: z.array(z.string()),
      catatan: z.string(),
    })
    .superRefine((nilai, ctx) => {
      if (!nilai.penggunaId) ctx.addIssue({ code: "custom", message: "Pilih karyawan terlebih dahulu.", path: ["penggunaId"] });
      if (!nilai.tanggal) ctx.addIssue({ code: "custom", message: "Pilih tanggal terlebih dahulu.", path: ["tanggal"] });
      if (nilai.status === "libur") return;
      const terpilih = nilai.shiftIds.filter((s) => s !== "");
      if (terpilih.length === 0) {
        ctx.addIssue({ code: "custom", message: "Pilih minimal satu shift.", path: ["shiftIds"] });
        return;
      }
      if (terpilih.some((s) => !idShiftAktif.has(s))) {
        ctx.addIssue({
          code: "custom",
          message: "Ada shift yang sudah nonaktif; pilih shift lain atau Libur.",
          path: ["shiftIds"],
        });
      }
    });
}

export type NilaiFormJadwal = z.infer<ReturnType<typeof buatSkemaJadwalManual>>;

/** Skema langkah 1 generate (keputusan GN4a); pesan galat sama dengan form lama. */
export const skemaGenerate = z
  .object({
    polaId: z.string(),
    mulai: z.date().optional(),
    sampai: z.date().optional(),
    karyawanIds: z.array(z.string()),
  })
  .superRefine((nilai, ctx) => {
    if (!nilai.polaId) {
      ctx.addIssue({ code: "custom", message: "Silakan pilih Pola Roster terlebih dahulu.", path: ["polaId"] });
      return;
    }
    if (!nilai.mulai || !nilai.sampai) {
      ctx.addIssue({ code: "custom", message: "Rentang tanggal mulai dan selesai wajib diisi.", path: ["mulai"] });
      return;
    }
    if (nilai.mulai > nilai.sampai) {
      ctx.addIssue({
        code: "custom",
        message: "Tanggal mulai tidak boleh lebih besar dari tanggal selesai.",
        path: ["mulai"],
      });
      return;
    }
    if (nilai.karyawanIds.length === 0) {
      ctx.addIssue({ code: "custom", message: "Minimal pilih 1 karyawan untuk digenerate jadwalnya.", path: ["karyawanIds"] });
    }
  });

export type NilaiGenerate = z.infer<typeof skemaGenerate>;