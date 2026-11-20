import type { StatusTransfer } from "@/types/transferStok";
import { queryCari } from "@/features/inventaris/cakupan";

export type TabTransfer = StatusTransfer | "ALL";

/** Lingkup satu sisi surat jalan (asal atau tujuan): satu lokasi, atau seluruh lokasi bertipe tertentu. */
export type LingkupSisi = { lokasiID: string } | { tipeLokasi: string };

/** Baris per halaman Penerimaan dan Pengiriman, sama dengan daftar surat jalan. */
export const PILIHAN_UKURAN_PEMANTAUAN = [10, 20, 50] as const;

/**
 * Query satu halaman pemantauan surat jalan DIKIRIM (Penerimaan dan
 * Pengiriman): lingkup satu lokasi dikirim sebagai dariLocationID atau
 * keLocationID, dan lingkup per tipe lokasi sebagai dariTipeLokasi atau
 * keTipeLokasi (B109). Pencarian nomor atau nama lokasi asal maupun tujuan
 * disaring server seperti daftar surat jalan, sehingga pagination.total
 * benar (keputusan rancangan butir 27; pemilik proyek, 20 November 2026,
 * menggantikan mode klien dengan saringTransfer).
 */
export function paramHalamanPemantauan(k: {
  asal?: LingkupSisi;
  tujuan?: LingkupSisi;
  cari: string;
  halaman: number;
  ukuran: number;
}): Record<string, string> {
  const sisi = (lingkup: LingkupSisi | undefined, awalan: "dari" | "ke"): Record<string, string> =>
    !lingkup
      ? {}
      : "lokasiID" in lingkup
        ? { [`${awalan}LocationID`]: lingkup.lokasiID }
        : { [`${awalan}TipeLokasi`]: lingkup.tipeLokasi };
  return {
    page: String(k.halaman),
    limit: String(k.ukuran),
    status: "DIKIRIM",
    ...sisi(k.asal, "dari"),
    ...sisi(k.tujuan, "ke"),
    ...queryCari(k.cari),
  };
}

/**
 * Query satu halaman daftar surat jalan (B105, B108, B109): status bila
 * bukan tab Semua, tipe lokasi asal sebagai dariTipeLokasi (ruang pengirim,
 * P8), dan pencarian nomor atau nama lokasi asal maupun tujuan (cakupan
 * backend, keputusan pemilik proyek 28 Oktober 2026). Seluruhnya disaring
 * server, sehingga pagination.total benar (keputusan rancangan butir 27).
 * Penerimaan dan pengiriman memakai paramHalamanPemantauan.
 */
export function paramHalamanSuratJalan(
  status: TabTransfer,
  tipeAsal: string,
  cari: string,
  halaman: number,
  ukuran: number,
): Record<string, string> {
  return {
    page: String(halaman),
    limit: String(ukuran),
    ...(status !== "ALL" ? { status } : {}),
    dariTipeLokasi: tipeAsal,
    ...queryCari(cari),
  };
}
