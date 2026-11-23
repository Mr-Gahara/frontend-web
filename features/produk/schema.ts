import * as z from "zod";
import type { BahanBaku } from "@/types/bahanBaku";

/**
 * Satuan resep yang diterima validator produk di backend (produkValidator.js).
 * Sama dengan satuan bahan baku sejak backend yoga 05c1149: pak dan unit
 * diterima, dan setiap satuan diperiksa terhadap availableUnits bahannya.
 */
export const SATUAN_RESEP = ["gram", "ml", "pcs", "kg", "liter", "pak", "unit"] as const;
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
  /** Satuan bawaan atau kemasan bahan (B360); diperiksa terhadap bahannya di buatSkemaProduk. */
  satuan: z.string().trim().min(1, "Satuan wajib dipilih"),
});

export const skemaProduk = z.object({
  namaProduk: z.string().trim().min(1, "Nama produk wajib diisi"),
  kategoriID: z.string().min(1, "Kategori wajib dipilih"),
  gambarProduk: z.string(),
  keterangan: z.string(),
  hargaDasar: z.number().min(0, "Harga dasar tidak boleh negatif"),
  hargaJual: z.number().min(0, "Harga jual tidak boleh negatif"),
  stok: z.number().min(0, "Stok tidak boleh negatif"),
  /** 0 berarti tidak dipantau (B237); hanya berlaku untuk produk berstok langsung. */
  stokMinimum: z.number().min(0, "Stok minimal tidak boleh negatif"),
  isUnlimitedStok: z.boolean(),
  resep: z.array(skemaResep),
});

export type NilaiFormProduk = z.infer<typeof skemaProduk>;

type BahanResep = Pick<BahanBaku, "id" | "namaBahan" | "satuan" | "availableUnits" | "konversi">;

/**
 * Satuan resep yang sah untuk sebuah bahan: availableUnits dari backend
 * (getAvailableUnits, aturan "hanya ke bawah"), diiris dengan satuan yang
 * diterima validator resep. Tanpa availableUnits, hanya satuan bahan itu
 * sendiri. Sejak backend fc29433 finalisasi menolak satuan resep yang tidak
 * dapat dikonversi ke satuan bahan, sehingga pilihan di luar daftar ini
 * baru gagal saat penjualan (keputusan FC4a). Sejak backend yoga 05c1149
 * pak dan unit sah untuk bahan bersatuan itu (kontrak/temuan.md butir 15),
 * dan backend menolak satuan di luar availableUnits saat produk disimpan.
 * Hasil kosong hanya terjadi bila satuan bahan tidak dikenal web.
 * Sejak backend P87 (B360) kemasan bahan (konversi, misalnya kaleng) ikut
 * ditawarkan sesudah satuan bawaan, sehingga resep tidak lagi perlu pecahan
 * kemasan; backend mengonversinya ke satuan dasar.
 */
export function satuanResepUntukBahan(bahan?: BahanResep | null): string[] {
  if (!bahan) return [...SATUAN_RESEP];
  const ditawarkan: readonly string[] = bahan.availableUnits?.length
    ? bahan.availableUnits
    : [bahan.satuan];
  const kemasan = (bahan.konversi ?? []).map((k) => k.satuan).filter((satuan) => ditawarkan.includes(satuan));
  const bawaan = SATUAN_RESEP.filter((satuan) => ditawarkan.includes(satuan) && !kemasan.includes(satuan));
  return [...bawaan, ...kemasan];
}

/**
 * Skema produk ditambah pemeriksaan satuan setiap baris resep terhadap
 * bahannya. Baris yang bahannya belum termuat di daftar dilewati.
 */
export function buatSkemaProduk(daftarBahan: readonly BahanResep[]) {
  return skemaProduk.superRefine((nilai, ctx) => {
    nilai.resep.forEach((baris, indeks) => {
      const bahan = daftarBahan.find((b) => b.id === baris.bahanBakuID);
      if (!bahan) return;
      const sah = satuanResepUntukBahan(bahan);
      if (sah.includes(baris.satuan)) return;
      ctx.addIssue({
        code: "custom",
        path: ["resep", indeks, "satuan"],
        message:
          sah.length === 0
            ? `Bahan bersatuan ${bahan.satuan} belum dapat dipakai di resep.`
            : `Untuk bahan bersatuan ${bahan.satuan}, pilih ${sah.join(" atau ")}.`,
      });
    });
  });
}