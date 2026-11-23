import { formatAngka } from "@/lib/format";
import type { BahanBaku } from "@/types/bahanBaku";

/**
 * Pilihan satuan masukan sebuah bahan (backend P87; pemilik proyek,
 * 23 November 2026): satuan dasar, turunan bawaannya (kg ke gram, liter ke
 * ml), lalu kemasan bahan, sesuai urutan availableUnits. Jumlah yang
 * tersimpan dan stok tetap dalam satuan dasar; server yang mengonversi.
 */

export type BahanBersatuan = { satuan: string } & Partial<Pick<BahanBaku, "availableUnits" | "konversi">>;

export interface PilihanSatuan {
  nilai: string;
  label: string;
}

/** "kaleng (290 ml)" untuk kemasan; satuan bawaan apa adanya. */
export function pilihanSatuan(bahan: BahanBersatuan | null | undefined): PilihanSatuan[] {
  if (!bahan) return [];
  const daftar = bahan.availableUnits?.length ? bahan.availableUnits : [bahan.satuan];
  return daftar.map((nilai) => {
    const kemasan = bahan.konversi?.find((k) => k.satuan === nilai);
    return { nilai, label: kemasan ? `${nilai} (${formatAngka(kemasan.isi)} ${bahan.satuan})` : nilai };
  });
}

/** Satuan masukan yang sah untuk bahan itu; kosong atau di luar daftar kembali ke satuan dasar. */
export function satuanSah(bahan: BahanBersatuan | null | undefined, satuan: string): string {
  if (!bahan) return satuan;
  return pilihanSatuan(bahan).some((p) => p.nilai === satuan) ? satuan : bahan.satuan;
}

/**
 * Jumlah dokumen bersatuan (pengajuan, surat jalan, opname): jumlah tersimpan
 * dalam satuan dasar, dan masukannya (satuanMasukan, jumlah masukan) bila
 * berbeda dari satuan dasar (P87 butir 7). Utama "2 kaleng", dasar "580 ml";
 * tanpa masukan berbeda hanya utama.
 */
export function teksJumlahBersatuan(
  jumlahDasar: number,
  satuanDasar: string | null | undefined,
  masukan?: { jumlah?: number | null; satuan?: string | null },
): { utama: string; dasar: string | null } {
  const dasar = satuanDasar ? `${formatAngka(jumlahDasar)} ${satuanDasar}` : formatAngka(jumlahDasar);
  if (masukan?.satuan && masukan.satuan !== satuanDasar && typeof masukan.jumlah === "number") {
    return { utama: `${formatAngka(masukan.jumlah)} ${masukan.satuan}`, dasar };
  }
  return { utama: dasar, dasar: null };
}

/**
 * Berapa satuan dasar dalam satu satuan masukan: 1 untuk satuan dasar,
 * 0,001 untuk turunan bawaan (gram dari kg, ml dari liter), isi kemasan untuk
 * konversi bahan, dan null bila satuan tidak dikenal. Dipakai membandingkan
 * masukan bersatuan dengan jumlah tersimpan (satuan dasar); server tetap
 * yang mengonversi saat menyimpan.
 */
export function faktorKeDasar(bahan: BahanBersatuan | null | undefined, satuan: string): number | null {
  if (!bahan) return satuan ? null : 1;
  if (!satuan || satuan === bahan.satuan) return 1;
  const kemasan = bahan.konversi?.find((k) => k.satuan === satuan);
  if (kemasan) return kemasan.isi;
  if ((bahan.satuan === "kg" && satuan === "gram") || (bahan.satuan === "liter" && satuan === "ml")) return 0.001;
  return null;
}
