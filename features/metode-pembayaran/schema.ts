import * as z from "zod";

/** Batas panjang nama, sama dengan validator dan model backend (NAMA_MAKS). */
export const NAMA_METODE_MAKS = 100;

/**
 * Skema form buat dan ubah metode pembayaran. Nama dipangkas, sehingga isian
 * berisi spasi saja ditolak (sejalan KU7a), dan dibatasi 100 karakter seperti
 * backend. Pesan akun kosong sama dengan halaman lama.
 */
export const skemaMetodePembayaran = z.object({
  namaPembayaran: z
    .string()
    .trim()
    .min(1, "Nama Pembayaran wajib diisi.")
    .max(NAMA_METODE_MAKS, `Nama Pembayaran maksimal ${NAMA_METODE_MAKS} karakter.`),
  kategori: z.enum(["tunai", "non-tunai"]),
  akunKasID: z.string().min(1, "Akun Tujuan wajib dipilih."),
  isActive: z.boolean(),
});

export type NilaiMetodePembayaran = z.infer<typeof skemaMetodePembayaran>;

/**
 * Skema dengan daftar akun aktif, sejalan PL1a. Backend menolak akun kas
 * nonaktif saat buat, pindah akun, dan mengaktifkan kembali metode
 * (metodePembayaranService._pastikanAkunKasMilikTenant). Akun lama yang
 * sudah nonaktif tetap boleh dibiarkan selama metode tidak diaktifkan
 * kembali, karena payload ubah tidak mengirim akun yang tidak berubah.
 */
export function buatSkemaMetodePembayaran(
  idAkunAktif: readonly string[],
  asal?: { akunKasID: string; isActive: boolean },
) {
  return skemaMetodePembayaran.superRefine((n, ctx) => {
    if (!n.akunKasID || idAkunAktif.includes(n.akunKasID)) return;
    const tetap = asal !== undefined && n.akunKasID === asal.akunKasID && !(n.isActive && !asal.isActive);
    if (!tetap) {
      ctx.addIssue({
        code: "custom",
        path: ["akunKasID"],
        message: "Akun Kas ini sudah nonaktif. Pilih akun kas yang aktif.",
      });
    }
  });
}