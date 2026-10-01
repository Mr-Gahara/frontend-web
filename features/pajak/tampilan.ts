import type { ModelPerhitungan, Pajak, RelasiPajakProduk } from "@/types/pajak";

/** Label model di tabel daftar pajak, sama dengan halaman lama. */
export const LABEL_MODEL: Record<ModelPerhitungan, string> = {
  1: "Inklusif",
  2: "Add-on (Eksklusif)",
  3: "Compound",
};

type ModelTeks = RelasiPajakProduk["pajak"]["model"];

/** GET /produkpajak/:targetID mengirim model sebagai teks (produkPajakService.getPajakByTarget). */
const MODEL_DARI_TEKS: Record<ModelTeks, ModelPerhitungan> = {
  Inclusive: 1,
  Exclusive: 2,
  Compound: 3,
};

/** Label model relasi, disamakan dengan tabel daftar; teks yang tidak dikenal ditampilkan apa adanya. */
export const labelModelRelasi = (m: ModelTeks): string => LABEL_MODEL[MODEL_DARI_TEKS[m]] ?? m;

/** Satu pajak per produk (PO6a): backend menyimpan relasi lewat upsert per produk. */
export const pajakTerpasang = (relasi: readonly RelasiPajakProduk[]): RelasiPajakProduk | null => relasi[0] ?? null;

/** Pajak yang ditawarkan untuk dipasang (PO6a): per produk dan aktif, selain yang sudah terpasang. */
export const pilihanPajakProduk = (daftar: readonly Pajak[], idTerpasang?: string): Pajak[] =>
  daftar.filter((p) => p.tipePajak && p.statusPajak && p.id !== idTerpasang);

/**
 * Pajak per transaksi aktif yang akan dinonaktifkan backend bila isian ini
 * disimpan (PO7a). pajakService.create dan update menonaktifkan seluruh
 * pajak per transaksi lain begitu pajak per transaksi disimpan dalam keadaan
 * aktif; pada update, keadaan akhir itulah yang menentukan.
 */
export function pajakTransaksiTerdampak(
  daftar: readonly Pajak[],
  n: { tipePajak: boolean; statusPajak: boolean },
  idSendiri?: string,
): Pajak[] {
  if (n.tipePajak || !n.statusPajak) return [];
  return daftar.filter((p) => !p.tipePajak && p.statusPajak && p.id !== idSendiri);
}