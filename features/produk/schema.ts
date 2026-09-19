import * as z from "zod";

/**
 * Satuan resep yang diterima validator produk di backend (produkValidator.js).
 * Lebih sempit dari satuan bahan baku: pak dan unit ditolak dengan 400.
 */
export const SATUAN_RESEP = ["gram", "ml", "pcs", "kg", "liter"] as const;
export type SatuanResep = (typeof SATUAN_RESEP)[number];

/**
 * setValueAs untuk input angka: isian kosong menjadi 0, sama seperti perilaku
 * z.coerce sebelumnya, tanpa membuat tipe input dan output skema berbeda.
 */
export function keAngka(nilai: unknown): number {
  if (nilai === "" || nilai === null || nilai === undefined) return 0;
  return Number(nilai);
}

const skemaResep = z.object({
  bahanBakuID: z.string().min(1, "Bahan baku harus dipilih"),
  jumlah: z.number().min(0.01, "Jumlah harus lebih dari 0"),
  satuan: z.enum(SATUAN_RESEP, {
    error:
      "Satuan tidak didukung untuk resep. Gunakan gram, ml, pcs, kg, atau liter.",
  }),
});

export const skemaProduk = z.object({
  namaProduk: z.string().trim().min(1, "Nama produk wajib diisi"),
  kategoriID: z.string().min(1, "Kategori wajib dipilih"),
  gambarProduk: z.string(),
  keterangan: z.string(),
  hargaDasar: z.number().min(0, "Harga dasar tidak boleh negatif"),
  hargaJual: z.number().min(0, "Harga jual tidak boleh negatif"),
  stok: z.number().min(0, "Stok tidak boleh negatif"),
  isUnlimitedStok: z.boolean(),
  resep: z.array(skemaResep),
});

export type NilaiFormProduk = z.infer<typeof skemaProduk>;