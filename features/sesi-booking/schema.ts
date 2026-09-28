import * as z from "zod";

/**
 * Skema form buat reservasi, dipindah dari halaman lama dengan pesan yang
 * sama. waktuMulai dan waktuSelesai diisi dari waktu per item
 * (waktu-booking.ts); jam yang kosong atau belum lengkap membuat keduanya
 * kosong, sehingga ditolak di sini (keputusan K-TW5a). diskonItem selalu
 * diberikan di nilai awal, sehingga skema tidak memakai .default() dan tipe
 * masukan sama dengan tipe keluaran (cara-kerja.md, Catatan form).
 */
const skemaItemBooking = z
  .object({
    dataAset: z.string().min(1, "Aset wajib dipilih"),
    waktuMulai: z.string().min(1, "Waktu mulai wajib diisi"),
    waktuSelesai: z.string().min(1, "Waktu selesai wajib diisi"),
    diskonItem: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.waktuMulai && data.waktuSelesai && new Date(data.waktuSelesai) <= new Date(data.waktuMulai)) {
      ctx.addIssue({
        code: "custom",
        message: "Waktu selesai harus setelah waktu mulai",
        path: ["waktuSelesai"],
      });
    }
  });

export const skemaBooking = z.object({
  dataPelanggan: z.string().min(1, "Pelanggan wajib dipilih"),
  items: z.array(skemaItemBooking).min(1),
});

export type NilaiFormBooking = z.infer<typeof skemaBooking>;