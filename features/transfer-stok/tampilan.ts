import type { SlugTab } from "@/lib/tab-url";
import type { StatusTransfer } from "@/types/transferStok";
import type { TabTransfer } from "./filter";

/** Urutan tab daftar surat jalan gudang. */
export const TAB_TRANSFER: readonly TabTransfer[] = ["ALL", "PENDING", "DIKIRIM", "DITERIMA", "BATAL"];

/**
 * Label status surat jalan. Satu sumber untuk tab, badge daftar, dan badge
 * detail, selaras dengan istilah dashboard gudang (belum dikirim, dalam
 * perjalanan).
 */
export const LABEL_STATUS_TRANSFER: Record<StatusTransfer, string> = {
  PENDING: "Belum Dikirim",
  DIKIRIM: "Dalam Perjalanan",
  DITERIMA: "Diterima",
  BATAL: "Dibatalkan",
};

/** Label tab daftar surat jalan: label status, ditambah tab Semua. */
export const LABEL_TAB_TRANSFER: Record<TabTransfer, string> = { ALL: "Semua", ...LABEL_STATUS_TRANSFER };

/**
 * Slug ?tab= daftar surat jalan (lib/tab-url.ts): kata yang terbaca, bukan kode
 * status. Slug tidak ikut berubah saat label tab diganti, agar tautan dashboard
 * dan tautan yang tersimpan tetap berlaku (draf kini berlabel Belum Dikirim,
 * selesai berlabel Diterima).
 */
export const SLUG_TAB_TRANSFER: SlugTab<TabTransfer> = {
  ALL: "semua",
  PENDING: "draf",
  DIKIRIM: "dikirim",
  DITERIMA: "selesai",
  BATAL: "dibatalkan",
};
