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