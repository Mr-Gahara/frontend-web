import * as z from "zod";

export const BATAS_SIKLUS = 31;

/**
 * Skema form pola roster untuk buat dan ubah (keputusan PL2a).
 *
 * Pesan galat mengikuti form lama. Siklus disimpan sebagai teks agar isian
 * kosong tetap tampil kosong (keputusan PL3a), dan dibatasi 31 hari
 * (keputusan PL4a). Hari kerja wajib memilih shift, dan shift itu harus
 * masih aktif, karena backend menolak pola yang memakai shift nonaktif
 * (polaRosterService #validateShifts, keputusan PL1a). Baris libur
 * menyimpan shiftID kosong di form, dan tidak mengirimnya di payload.
 */
export function buatSkemaPolaRoster(idShiftAktif: ReadonlySet<string>) {
  return z
    .object({
      namaPola: z.string().trim().min(1, "Nama Pola wajib diisi."),
      siklus: z.string(),
      detailSiklus: z.array(
        z.object({ hariKe: z.number(), isLibur: z.boolean(), shiftID: z.string() }),
      ),
    })
    .superRefine((nilai, ctx) => {
      const siklus = Number(nilai.siklus);
      if (nilai.siklus.trim() === "" || !Number.isInteger(siklus) || siklus < 1) {
        ctx.addIssue({ code: "custom", message: "Jumlah siklus minimal adalah 1 hari.", path: ["siklus"] });
        return;
      }
      if (siklus > BATAS_SIKLUS) {
        ctx.addIssue({
          code: "custom",
          message: `Jumlah siklus maksimal adalah ${BATAS_SIKLUS} hari.`,
          path: ["siklus"],
        });
        return;
      }
      const kerja = nilai.detailSiklus.filter((d) => !d.isLibur);
      if (kerja.some((d) => d.shiftID === "")) {
        ctx.addIssue({
          code: "custom",
          message: "Ada baris hari kerja yang belum dipilih master shift-nya.",
          path: ["detailSiklus"],
        });
        return;
      }
      const nonaktif = kerja.find((d) => !idShiftAktif.has(d.shiftID));
      if (nonaktif) {
        ctx.addIssue({
          code: "custom",
          message: `Shift pada hari ke-${nonaktif.hariKe} sudah nonaktif; pilih shift lain atau Libur.`,
          path: ["detailSiklus"],
        });
      }
    });
}

export type NilaiFormPolaRoster = z.infer<ReturnType<typeof buatSkemaPolaRoster>>;