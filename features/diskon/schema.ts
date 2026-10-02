import { z } from "zod";

/**
 * Skema form diskon, dipakai buat dan ubah. Mengikuti
 * validators/diskonValidator.js backend: nama wajib dan paling banyak 100
 * karakter, nilai angka lebih dari 0, dan persen paling banyak 100. Angka
 * disimpan sebagai teks agar isian kosong tetap tampil kosong. Aturan
 * tambahan (keputusan PD3a): tanggal sebagai YYYY-MM-DD lokal (PD6a), jam
 * sebagai teks mentah HH:mm yang diisi berpasangan, dan kuota bilangan
 * bulat minimal 1; isian kosong berarti tanpa batas.
 */
const POLA_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAKS_PRODUK = 500;
export const skemaDiskon = z
  .object({
    namaDiskon: z
      .string()
      .trim()
      .min(1, "Nama diskon wajib diisi.")
      .max(100, "Nama diskon paling banyak 100 karakter."),
    cakupan: z.enum(["Global", "Item"]),
    tipe: z.enum(["persen", "nominal"]),
    nilai: z.string().trim(),
    bisaDigabung: z.boolean(),
    status: z.enum(["Aktif", "Non-Aktif"]),
    tanggalMulai: z.string(),
    tanggalBerakhir: z.string(),
    jamMulai: z.string(),
    jamSelesai: z.string(),
    hariAktif: z.array(z.number()),
    minimalBelanja: z.string().trim(),
    kuota: z.string().trim(),
    kuotaPerPelanggan: z.string().trim(),
    produkIDs: z.array(z.string()),
    hitungPerBarang: z.boolean(),
  })
  .superRefine((nilai, ctx) => {
    const angka = Number(nilai.nilai);
    if (nilai.nilai === "" || !Number.isFinite(angka) || angka <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["nilai"],
        message: "Nilai potongan wajib berupa angka lebih dari 0.",
      });
    } else if (nilai.tipe === "persen" && angka > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["nilai"],
        message: "Nilai diskon persen tidak boleh melebihi 100.",
      });
    }

    if (
      nilai.tanggalMulai !== "" &&
      nilai.tanggalBerakhir !== "" &&
      nilai.tanggalBerakhir < nilai.tanggalMulai
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["tanggalBerakhir"],
        message: "Tanggal berakhir tidak boleh sebelum tanggal mulai.",
      });
    }

    if (nilai.jamMulai !== "" || nilai.jamSelesai !== "") {
      if (!POLA_JAM.test(nilai.jamMulai) || !POLA_JAM.test(nilai.jamSelesai)) {
        ctx.addIssue({
          code: "custom",
          path: ["jamSelesai"],
          message: "Jam mulai dan jam selesai harus diisi lengkap, atau keduanya dikosongkan.",
        });
      } else if (nilai.jamMulai === nilai.jamSelesai) {
        ctx.addIssue({
          code: "custom",
          path: ["jamSelesai"],
          message: "Jam mulai dan jam selesai tidak boleh sama.",
        });
      }
    }

    if (nilai.minimalBelanja !== "") {
      const minimal = Number(nilai.minimalBelanja);
      if (!Number.isFinite(minimal) || minimal < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["minimalBelanja"],
          message: "Minimal belanja harus angka 0 atau lebih.",
        });
      }
    }

    for (const field of ["kuota", "kuotaPerPelanggan"] as const) {
      if (nilai[field] === "") continue;
      const jumlah = Number(nilai[field]);
      if (!Number.isInteger(jumlah) || jumlah < 1) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Kuota harus bilangan bulat minimal 1, atau dikosongkan.",
        });
      }
    }

    if (nilai.produkIDs.length > MAKS_PRODUK) {
      ctx.addIssue({
        code: "custom",
        path: ["produkIDs"],
        message: `Produk tertentu paling banyak ${MAKS_PRODUK}.`,
      });
    }
  });

export type NilaiFormDiskon = z.infer<typeof skemaDiskon>;