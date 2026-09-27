import * as z from "zod";

const POLA_JAM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Isian kosong atau berisi spasi saja menjadi undefined, agar ditolak, bukan dibaca 0. */
const kosongMenjadiTakTerisi = (nilai: unknown) =>
  typeof nilai === "string" && nilai.trim() === "" ? undefined : nilai;

/**
 * Skema form tarif untuk halaman buat dan edit.
 *
 * Sebelum migrasi, kedua halaman memuat skema yang identik. z.coerce
 * dipertahankan (keputusan T2a) karena halaman mengikat angka lewat register
 * biasa, sehingga nilainya tiba sebagai teks; tipe masukan dan keluaran
 * dinyatakan eksplisit di useForm. Harga kosong ditolak, sedangkan 0 yang
 * diketik tetap sah (T3b): z.coerce membaca teks kosong sebagai 0, dan tarif
 * 0 yang tersimpan tanpa sengaja akan dipilih otomatis saat booking. Nama
 * dipangkas, sehingga isian berisi spasi saja ditolak (T4a).
 */
export const skemaTarif = z
  .object({
    namaTarif: z.string().trim().min(1, "Nama tarif wajib diisi"),
    basisPerhitungan: z.enum(["per jam", "per sesi"]),
    harga: z.preprocess(
      kosongMenjadiTakTerisi,
      z.coerce.number({ error: "Harga wajib diisi" }).min(0, "Harga tidak boleh negatif"),
    ),
    durasiMinimum: z.coerce.number().min(1, "Durasi minimum minimal 1"),
    isActive: z.boolean().default(true),
    hariAktif: z.array(z.number()).default([]),
    jamMulai: z.string().optional(),
    jamSelesai: z.string().optional(),
    prioritas: z.coerce.number().min(1, "Prioritas minimal 1").default(1),
    tipeAsetID: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.jamMulai && !POLA_JAM.test(data.jamMulai)) {
      ctx.addIssue({ code: "custom", message: "Format harus HH:mm", path: ["jamMulai"] });
    }
    if (data.jamSelesai && !POLA_JAM.test(data.jamSelesai)) {
      ctx.addIssue({ code: "custom", message: "Format harus HH:mm", path: ["jamSelesai"] });
    }
    if (
      data.jamMulai &&
      data.jamSelesai &&
      POLA_JAM.test(data.jamMulai) &&
      POLA_JAM.test(data.jamSelesai) &&
      data.jamMulai >= data.jamSelesai
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Jam mulai harus lebih awal dari jam selesai",
        path: ["jamMulai"],
      });
    }
  });

export type NilaiMasukTarif = z.input<typeof skemaTarif>;
export type NilaiFormTarif = z.output<typeof skemaTarif>;

/** Nilai awal halaman buat, sama dengan defaultValues sebelum migrasi. */
export const NILAI_AWAL_TARIF: NilaiMasukTarif = {
  namaTarif: "",
  basisPerhitungan: "per jam",
  harga: "",
  durasiMinimum: 1,
  isActive: true,
  hariAktif: [0, 1, 2, 3, 4, 5, 6],
  jamMulai: "00:00",
  jamSelesai: "23:59",
  prioritas: 1,
  tipeAsetID: [],
};