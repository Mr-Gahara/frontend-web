import { format } from "date-fns";
import type { SlugTab } from "@/lib/tab-url";
import type { RuangPengajuan } from "./filter";
import type { TabPengajuan } from "./izin";
import type { TahapPengajuan } from "./tahap";
import type { ArahPengajuan } from "./arah";
import { id as localeID } from "date-fns/locale";

export function formatTanggalPengajuan(iso: string | null | undefined): string {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMMM yyyy, HH:mm", { locale: localeID });
}

/**
 * Slug ?tab= per ruang (lib/tab-url.ts): kata yang terbaca, bukan kode status.
 * Slug tidak ikut berubah saat label tab diganti, agar tautan dashboard dan
 * tautan yang tersimpan tetap berlaku (perlu-tinjauan kini berlabel Perlu Disetujui).
 */
export const SLUG_TAB_PENGAJUAN: Record<RuangPengajuan, SlugTab<TabPengajuan>> = {
  outlet: { ALL: "semua", DRAFT: "draf", SUBMITTED: "menunggu", DISETUJUI: "disetujui", REJECTED: "ditolak", COMPLETED: "selesai" },
  gudang: { SUBMITTED: "perlu-tinjauan", PERLU_SURAT_JALAN: "perlu-surat-jalan", COMPLETED: "selesai", REJECTED: "ditolak", ALL: "semua" },
};

/**
 * Label tahap pengajuan (tahap.ts) per ruang. Satu sumber untuk tab, badge
 * daftar, dan badge kedua halaman detail, agar istilahnya tidak berbeda antar
 * tempat. Lengkap untuk setiap tahap, sehingga kode status mentah tidak pernah
 * tampil.
 */
export const LABEL_TAHAP_PENGAJUAN: Record<RuangPengajuan, Record<TahapPengajuan, string>> = {
  outlet: {
    DRAFT: "Draft",
    SUBMITTED: "Menunggu Persetujuan",
    PERLU_SURAT_JALAN: "Disetujui",
    SURAT_JALAN_DIBUAT: "Surat Jalan Dibuat",
    COMPLETED: "Selesai",
    REJECTED: "Ditolak",
  },
  gudang: {
    DRAFT: "Draft",
    SUBMITTED: "Perlu Disetujui",
    PERLU_SURAT_JALAN: "Perlu Surat Jalan",
    SURAT_JALAN_DIBUAT: "Surat Jalan Dibuat",
    COMPLETED: "Selesai",
    REJECTED: "Ditolak",
  },
};

/**
 * Label tab daftar pengajuan. Tab berstatus tunggal dan tab PERLU_SURAT_JALAN
 * memakai label tahapnya. Tab DISETUJUI (APPROVED dan PENDING, dengan atau
 * tanpa surat jalan), serta APPROVED dan PENDING yang tidak dipakai sebagai
 * tab, berlabel Disetujui.
 */
export function labelTabPengajuan(ruang: RuangPengajuan, tab: TabPengajuan): string {
  switch (tab) {
    case "ALL":
      return "Semua";
    case "DISETUJUI":
    case "APPROVED":
    case "PENDING":
      return "Disetujui";
    default:
      return LABEL_TAHAP_PENGAJUAN[ruang][tab];
  }
}

/** Label arah pengajuan untuk badge dan filter daftar (AR4a). */
export const LABEL_ARAH_PENGAJUAN: Record<ArahPengajuan, string> = {
  GUDANG_KE_OUTLET: "Permintaan",
  OUTLET_KE_GUDANG: "Pengembalian",
};
