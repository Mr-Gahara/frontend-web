import type { StatusTransfer, TransferStok } from "@/types/transferStok";
import type { FilterTransferStok } from "./api";

export type TabTransfer = StatusTransfer | "ALL";

/** Lingkup lokasi tujuan: satu lokasi, atau seluruh lokasi bertipe tertentu. */
export type LingkupTujuan = { lokasiID: string } | { tipeLokasi: string };

export interface KriteriaTransfer {
  status?: TabTransfer;
  tujuan?: LingkupTujuan;
  cari?: string;
  /** Lokasi yang dicocokkan pencarian selain nomor surat jalan; bawaan tujuan. */
  cariPada?: "asal" | "tujuan";
}

/**
 * Filter yang dikirim ke server. Daftar surat jalan disaring server menurut
 * status dan lokasi (kontrak/temuan.md butir 33, terbukti lewat permintaan
 * nyata terhadap backend `50eede7`). Lingkup satu lokasi tujuan dikirim
 * sebagai keLocationID, karena locationID di server berarti asal atau tujuan.
 * Lingkup per tipe lokasi tidak punya padanan di server.
 */
export function filterServerTransfer(k: KriteriaTransfer): FilterTransferStok {
  const filter: FilterTransferStok = {};
  if (k.status && k.status !== "ALL") filter.status = k.status;
  if (k.tujuan && "lokasiID" in k.tujuan) filter.keLocationID = k.tujuan.lokasiID;
  return filter;
}

/**
 * Penyaringan di klien untuk yang tidak dilakukan server: lingkup tujuan per
 * tipe lokasi dan pencarian. Status tidak disaring di sini: pemanggil
 * mengirimnya lewat filterServerTransfer, dan `status` di kriteria diabaikan.
 * Lokasi tujuan tunggal tetap dicocokkan, sejalan dengan keLocationID.
 */
export function saringTransfer(daftar: readonly TransferStok[], k: KriteriaTransfer): TransferStok[] {
  const cari = (k.cari ?? "").trim().toLowerCase();
  return daftar.filter((t) => {
    if (k.tujuan) {
      const cocok =
        "lokasiID" in k.tujuan ? t.keLokasi?.id === k.tujuan.lokasiID : t.keLokasi?.tipe === k.tujuan.tipeLokasi;
      if (!cocok) return false;
    }
    if (!cari) return true;
    const lokasi = k.cariPada === "asal" ? t.dariLokasi : t.keLokasi;
    return t.nomorTransfer.toLowerCase().includes(cari) || (lokasi?.nama ?? "").toLowerCase().includes(cari);
  });
}