import * as z from "zod";

/**
 * Skema form pembelian stok (pemilik proyek, 25 Oktober 2026). Jumlah dan
 * harga disimpan sebagai teks agar isian kosong tetap kosong. Jumlah boleh
 * desimal dengan koma atau titik dan minimal 1, sesuai skema
 * models/pembelianStokModel.js; validator backend hanya menolak jumlah di
 * bawah atau sama dengan 0. Harga beli bilangan bulat tidak negatif. Satu
 * bahan hanya boleh muncul di satu baris, walau backend menerima bahan
 * ganda. Tanggal berupa YYYY-MM-DD hari lokal dan tidak boleh melewati hari
 * ini.
 */

const POLA_DESIMAL = /^\d+([.,]\d+)?$/;
const POLA_BULAT = /^\d+$/;
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/** Angka dari teks isian, dengan koma sebagai pemisah desimal; NaN bila bukan angka. */
export function angkaDariTeks(teks: string): number {
  const bersih = teks.trim();
  return POLA_DESIMAL.test(bersih) ? Number(bersih.replace(",", ".")) : Number.NaN;
}

/** Harga beli dari teks isian; NaN bila bukan bilangan bulat tidak negatif. */
export function hargaDariTeks(teks: string): number {
  const bersih = teks.trim();
  return POLA_BULAT.test(bersih) ? Number(bersih) : Number.NaN;
}

const teksWajib = (pesan: string) => z.string().trim().min(1, pesan);

const tanggalSampai = (hariIni: string) =>
  z
    .string()
    .regex(POLA_TANGGAL, "Tanggal wajib diisi.")
    .refine((v): boolean => v <= hariIni, "Tanggal tidak boleh melewati hari ini.");

export const skemaBarangPembelian = z.object({
  bahanBakuID: z.string().min(1, "Bahan baku wajib dipilih."),
  jumlah: teksWajib("Jumlah wajib diisi.").refine(
    (v): boolean => angkaDariTeks(v) >= 1,
    "Jumlah minimal 1.",
  ),
  hargaBeli: teksWajib("Harga beli wajib diisi.").refine(
    (v): boolean => Number.isFinite(hargaDariTeks(v)),
    "Harga beli harus bilangan bulat, boleh 0.",
  ),
});

export type IsianBarangPembelian = z.infer<typeof skemaBarangPembelian>;

export function buatSkemaCatatPembelian(hariIni: string) {
  return z.object({
    supplier: teksWajib("Supplier wajib diisi."),
    nomorFaktur: z.string().trim(),
    akunKasID: z.string().min(1, "Akun kas wajib dipilih."),
    tanggal: tanggalSampai(hariIni),
    keterangan: teksWajib("Keterangan wajib diisi."),
    items: z
      .array(skemaBarangPembelian)
      .min(1, "Tambahkan minimal satu barang.")
      .superRefine((items, ctx) => {
        const dilihat = new Set<string>();
        items.forEach((item, indeks) => {
          if (!item.bahanBakuID) return;
          if (dilihat.has(item.bahanBakuID)) {
            ctx.addIssue({
              code: "custom",
              path: [indeks, "bahanBakuID"],
              message: "Bahan ini sudah ada di baris lain.",
            });
          }
          dilihat.add(item.bahanBakuID);
        });
      }),
  });
}

export type IsianCatatPembelian = z.infer<ReturnType<typeof buatSkemaCatatPembelian>>;

/**
 * Skema ubah info (B76): supplier, nomor faktur, tanggal, dan keterangan.
 * Nomor faktur wajib, karena indeks unik { tenantID, nomorFaktur } ikut
 * mengindeks teks kosong dan null, sehingga pembelian kedua yang
 * dikosongkan akan bentrok.
 */
export function buatSkemaUbahPembelian(hariIni: string) {
  return z.object({
    supplier: teksWajib("Supplier wajib diisi."),
    nomorFaktur: teksWajib("Nomor faktur wajib diisi."),
    tanggal: tanggalSampai(hariIni),
    keterangan: teksWajib("Keterangan wajib diisi."),
  });
}

export type IsianUbahPembelian = z.infer<ReturnType<typeof buatSkemaUbahPembelian>>;