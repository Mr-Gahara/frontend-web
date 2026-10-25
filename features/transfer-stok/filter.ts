import type { StatusTransfer, TransferStok } from "@/types/transferStok";
import type { FilterTransferStok } from "./api";

export type TabTransfer = StatusTransfer | "ALL";

/** Lingkup satu sisi surat jalan (asal atau tujuan): satu lokasi, atau seluruh lokasi bertipe tertentu. */
export type LingkupSisi = { lokasiID: string } | { tipeLokasi: string };

export interface KriteriaTransfer {
  status?: TabTransfer;
  /** Asal barang (P8): daftar dan pemantauan surat jalan memakai ruang pengirimnya. */
  asal?: LingkupSisi;
  tujuan?: LingkupSisi;
  cari?: string;
  /** Lokasi yang dicocokkan pencarian selain nomor surat jalan; bawaan tujuan. */
  cariPada?: "asal" | "tujuan";
}

/**
 * Filter yang dikirim ke server. Daftar surat jalan disaring server menurut
 * status dan lokasi (kontrak/temuan.md butir 33, terbukti lewat permintaan
 * nyata terhadap backend `50eede7`). Lingkup satu lokasi tujuan dikirim
 * sebagai keLocationID, karena locationID di server berarti asal atau tujuan.
 * Lingkup satu lokasi asal dikirim sebagai dariLocationID
 * (transferStokService.js baris 339 dan 354, backend ridho b5b367a).
 * Lingkup per tipe lokasi tidak punya padanan di server.
 */
export function filterServerTransfer(k: KriteriaTransfer): FilterTransferStok {
  const filter: FilterTransferStok = {};
  if (k.status && k.status !== "ALL") filter.status = k.status;
  if (k.asal && "lokasiID" in k.asal) filter.dariLocationID = k.asal.lokasiID;
  if (k.tujuan && "lokasiID" in k.tujuan) filter.keLocationID = k.tujuan.lokasiID;
  return filter;
}

/**
 * Penyaringan di klien untuk yang tidak dilakukan server: lingkup asal dan
 * tujuan per tipe lokasi, serta pencarian. Status tidak disaring di sini:
 * pemanggil mengirimnya lewat filterServerTransfer, dan `status` di kriteria
 * diabaikan. Lokasi asal dan tujuan tunggal tetap dicocokkan, sejalan dengan
 * dariLocationID dan keLocationID.
 */
export function saringTransfer(daftar: readonly TransferStok[], k: KriteriaTransfer): TransferStok[] {
  const cari = (k.cari ?? "").trim().toLowerCase();
  return daftar.filter((t) => {
    if (k.asal && !cocokSisi(t.dariLokasi, k.asal)) return false;
    if (k.tujuan && !cocokSisi(t.keLokasi, k.tujuan)) return false;
    if (!cari) return true;
    const lokasi = k.cariPada === "asal" ? t.dariLokasi : t.keLokasi;
    return t.nomorTransfer.toLowerCase().includes(cari) || (lokasi?.nama ?? "").toLowerCase().includes(cari);
  });
}

function cocokSisi(lokasi: TransferStok["dariLokasi"], lingkup: LingkupSisi): boolean {
  return "lokasiID" in lingkup ? lokasi?.id === lingkup.lokasiID : lokasi?.tipe === lingkup.tipeLokasi;
}