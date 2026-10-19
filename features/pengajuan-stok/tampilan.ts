import { format } from "date-fns";
import type { SlugTab } from "@/lib/tab-url";
import type { RuangPengajuan } from "./filter";
import type { TabPengajuan } from "./izin";
import { id as localeID } from "date-fns/locale";

export function formatTanggalPengajuan(iso: string | null | undefined): string {
  if (!iso) return "-";
  return format(new Date(iso), "dd MMMM yyyy, HH:mm", { locale: localeID });
}

/** Slug ?tab= per ruang (lib/tab-url.ts): kata yang terbaca, mengikuti label tab, bukan kode status. */
export const SLUG_TAB_PENGAJUAN: Record<RuangPengajuan, SlugTab<TabPengajuan>> = {
  outlet: { ALL: "semua", DRAFT: "draf", SUBMITTED: "menunggu", DISETUJUI: "disetujui", REJECTED: "ditolak", COMPLETED: "selesai" },
  gudang: { SUBMITTED: "perlu-tinjauan", PERLU_SURAT_JALAN: "perlu-surat-jalan", COMPLETED: "selesai", REJECTED: "ditolak", ALL: "semua" },
};
