import * as z from "zod";

export const POLA_JAM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Skema form master shift untuk buat dan ubah (keputusan SH3a).
 *
 * Pesan galat mengikuti form lama. Jam berupa teks HH:mm dari InputWaktu
 * (gabungTeksWaktu), sehingga isian yang belum lengkap ditolak di sini.
 * Toleransi disimpan sebagai teks agar isian kosong tetap tampil kosong:
 * kosong berarti 0, negatif ditolak, dan selain bilangan bulat ditolak
 * (keputusan SH4a). Lintas hari tidak ada di skema, karena dihitung dari
 * jam (keputusan SH2a, hitungLintasHari di payload.ts).
 */
export const skemaShift = z.object({
  namaShift: z.string().trim().min(1, "Nama shift wajib diisi."),
  jamMasuk: z.string().regex(POLA_JAM, "Isi jam masuk dengan lengkap."),
  jamPulang: z.string().regex(POLA_JAM, "Isi jam pulang dengan lengkap."),
  toleransi: z.string().superRefine((nilai, ctx) => {
    const teks = nilai.trim();
    if (teks === "") return;
    const angka = Number(teks);
    if (Number.isNaN(angka)) {
      ctx.addIssue({ code: "custom", message: "Toleransi harus berupa angka menit." });
    } else if (angka < 0) {
      ctx.addIssue({ code: "custom", message: "Toleransi tidak boleh negatif." });
    } else if (!Number.isInteger(angka)) {
      ctx.addIssue({ code: "custom", message: "Toleransi harus bilangan bulat menit." });
    }
  }),
  status: z.enum(["Aktif", "Non-Aktif"]),
});

export type NilaiFormShift = z.infer<typeof skemaShift>;