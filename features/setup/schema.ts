import * as z from "zod";
import { SATUAN_RESEP } from "@/features/produk/schema";
import { SATUAN_BAHAN_OPTIONS } from "@/types/bahanBaku";

/**
 * Skema langkah setup yang belum punya padanan siap pakai. Lokasi, kategori,
 * dan pajak memakai skema modulnya langsung. Bahan baku, produk, dan sesi
 * booking memakai isian teks (tanpa z.coerce, docs/referensi/helper-dan-shell.md,
 * Catatan form) dengan aturan dan pesan yang sama dengan skema modulnya;
 * isian diubah menjadi angka saat disambungkan ke backend.
 */

/** Pesan galat untuk isian angka berbentuk teks, atau null bila sah. */
export function masalahAngka(teks: string, label: string, min = 0): string | null {
  const t = teks.trim();
  if (t === "") return `${label} wajib diisi.`;
  const n = Number(t);
  if (!Number.isFinite(n)) return `${label} harus berupa angka.`;
  if (n < min) return min === 0 ? `${label} tidak boleh negatif.` : `${label} minimal ${min}.`;
  return null;
}

/** Seperti masalahAngka, tetapi nilainya harus lebih dari 0 (stok produk setup, B238). */
export function masalahAngkaPositif(teks: string, label: string): string | null {
  const pesan = masalahAngka(teks, label);
  if (pesan) return pesan;
  return Number(teks.trim()) > 0 ? null : `${label} harus lebih dari 0.`;
}

const teksAngka = (label: string, min = 0) =>
  z.string().superRefine((t, ctx) => {
    const pesan = masalahAngka(t, label, min);
    if (pesan) ctx.addIssue({ code: "custom", message: pesan });
  });

/** Sama dengan skemaTenant: nama toko dipangkas, minimal 3 karakter. */
export const skemaNamaToko = z.object({
  namaToko: z.string().trim().min(3, "Nama toko minimal 3 karakter."),
});
export type NilaiNamaToko = z.infer<typeof skemaNamaToko>;

export const skemaOwner = z
  .object({
    // Sama dengan validateRegisterOwnerPayload backend: 3 sampai 50 karakter.
    nama: z
      .string()
      .trim()
      .min(1, "Nama Owner wajib diisi.")
      .min(3, "Nama Owner minimal 3 karakter.")
      .max(50, "Nama Owner maksimal 50 karakter."),
    pin: z.string().regex(/^\d{6}$/, "PIN harus 6 digit angka."),
    ulangiPin: z.string().min(1, "Ulangi PIN wajib diisi."),
  })
  .refine((n) => n.pin === n.ulangiPin, { path: ["ulangiPin"], message: "PIN tidak sama." });
export type NilaiOwner = z.infer<typeof skemaOwner>;

/** Aturan nama dan satuan sama dengan bahanBakuSchema. */
export const skemaBahanSetup = z.object({
  namaBahan: z
    .string()
    .trim()
    .min(1, "Nama bahan baku wajib diisi.")
    .max(100, "Nama bahan baku maksimal 100 karakter."),
  satuan: z.enum(SATUAN_BAHAN_OPTIONS, { message: "Satuan tidak dikenali." }),
  stok: teksAngka("Stok awal"),
  stokMinimum: teksAngka("Batas stok minimum"),
});
export type NilaiBahanSetup = z.infer<typeof skemaBahanSetup>;

/**
 * Produk setup. Stok dan resep hanya diperiksa bila dipakai. Produk berstok
 * wajib punya stok awal dan stok minimal di atas 0 agar langkah produk
 * selesai (B238); resep membuat stok dihitung dari bahan baku.
 */
export const skemaProdukSetup = z
  .object({
    namaProduk: z.string().trim().min(1, "Nama produk wajib diisi"),
    kategoriID: z.string().min(1, "Kategori wajib dipilih"),
    hargaDasar: teksAngka("Harga dasar"),
    hargaJual: teksAngka("Harga jual"),
    pakaiStok: z.boolean(),
    stok: z.string(),
    stokMinimal: z.string(),
    pakaiResep: z.boolean(),
    resep: z.array(z.object({ bahan: z.string(), jumlah: z.string(), satuan: z.enum(SATUAN_RESEP) })),
  })
  .superRefine((n, ctx) => {
    if (n.pakaiStok && !n.pakaiResep) {
      for (const [field, label] of [
        ["stok", "Stok awal"],
        ["stokMinimal", "Stok minimal"],
      ] as const) {
        const pesan = masalahAngkaPositif(n[field], label);
        if (pesan) ctx.addIssue({ code: "custom", path: [field], message: pesan });
      }
    }
    if (!n.pakaiResep) return;
    if (n.resep.length === 0) {
      ctx.addIssue({ code: "custom", path: ["resep"], message: "Tambahkan minimal satu bahan." });
    }
    n.resep.forEach((r, i) => {
      if (r.bahan === "") ctx.addIssue({ code: "custom", path: ["resep", i, "bahan"], message: "Bahan baku harus dipilih" });
      const t = r.jumlah.trim();
      if (t === "" || !Number.isFinite(Number(t)) || Number(t) < 0.01) {
        ctx.addIssue({ code: "custom", path: ["resep", i, "jumlah"], message: "Jumlah harus lebih dari 0" });
      }
    });
  });
export type NilaiProdukSetup = z.infer<typeof skemaProdukSetup>;

/** Tipe aset, aset, dan tarif pertama; aturan mengikuti skema modulnya. */
export const skemaBookingSetup = z.object({
  namaTipeAset: z
    .string()
    .trim()
    .min(1, "Nama tipe aset wajib diisi")
    .min(2, "Nama tipe aset minimal 2 karakter"),
  namaAset: z.string().trim().min(1, "Nama aset wajib diisi"),
  namaTarif: z.string().trim().min(1, "Nama tarif wajib diisi"),
  basisPerhitungan: z.enum(["per jam", "per sesi"]),
  harga: teksAngka("Harga"),
  durasiMinimum: teksAngka("Durasi minimum", 1),
});
export type NilaiBookingSetup = z.infer<typeof skemaBookingSetup>;
