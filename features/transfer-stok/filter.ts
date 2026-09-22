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
 * Filter yang dikirim ke server. Backend hari ini mengabaikan seluruh query
 * daftar surat jalan (kontrak/temuan.md butir 33), sehingga saringTransfer
 * tetap wajib. Filter tetap dikirim agar halaman langsung memakai
 * penyaringan server begitu backend mendukungnya.
 */
export function filterServerTransfer(k: KriteriaTransfer): FilterTransferStok {
  const filter: FilterTransferStok = {};
  if (k.status && k.status !== "ALL") filter.status = k.status;
  if (k.tujuan && "lokasiID" in k.tujuan) filter.locationID = k.tujuan.lokasiID;
  return filter;
}

export function saringTransfer(daftar: readonly TransferStok[], k: KriteriaTransfer): TransferStok[] {
  const cari = (k.cari ?? "").trim().toLowerCase();
  return daftar.filter((t) => {
    if (k.status && k.status !== "ALL" && t.status !== k.status) return false;
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