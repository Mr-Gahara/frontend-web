import type { PengajuanStok } from "@/types/pengajuanStok";

/**
 * Tahap pengajuan yang ditampilkan kepada pengguna.
 *
 * APPROVED dan PENDING sama-sama berarti sudah disetujui. PENDING menandai
 * surat jalan sebelumnya dibatalkan atau drafnya dihapus; backend lalu
 * mengosongkan transferStokID (transferStokService baris 636 sampai 655 dan
 * 750 sampai 777) dan mengizinkan surat jalan dibuat lagi (baris 210 sampai
 * 223). Membuat surat jalan hanya mengisi transferStokID tanpa mengubah
 * status (baris 299 sampai 301), sehingga pengajuan PENDING pun bisa sudah
 * punya surat jalan. Karena itu tahap ditentukan oleh ada tidaknya surat
 * jalan, bukan oleh status saja.
 */
export type TahapPengajuan =
  | "DRAFT"
  | "SUBMITTED"
  | "PERLU_SURAT_JALAN"
  | "SURAT_JALAN_DIBUAT"
  | "COMPLETED"
  | "REJECTED";

export function tahapPengajuan(p: Pick<PengajuanStok, "status" | "transferStokID">): TahapPengajuan {
  if (p.status === "APPROVED" || p.status === "PENDING") {
    return p.transferStokID ? "SURAT_JALAN_DIBUAT" : "PERLU_SURAT_JALAN";
  }
  return p.status;
}