import type { SlugTab } from "@/lib/tab-url";
import type { TabTransfer } from "./filter";

/** Urutan tab daftar surat jalan gudang. */
export const TAB_TRANSFER: readonly TabTransfer[] = ["ALL", "PENDING", "DIKIRIM", "DITERIMA", "BATAL"];

/** Label tab dipertahankan dari halaman lama. */
export const LABEL_TAB_TRANSFER: Record<TabTransfer, string> = {
  ALL: "Semua Status",
  PENDING: "DRAFT SJ",
  DIKIRIM: "SEDANG DIKIRIM",
  DITERIMA: "SELESAI",
  BATAL: "DIBATALKAN",
};

/** Slug ?tab= daftar surat jalan (lib/tab-url.ts), mengikuti label tab, bukan kode status. */
export const SLUG_TAB_TRANSFER: SlugTab<TabTransfer> = {
  ALL: "semua",
  PENDING: "draf",
  DIKIRIM: "dikirim",
  DITERIMA: "selesai",
  BATAL: "dibatalkan",
};
