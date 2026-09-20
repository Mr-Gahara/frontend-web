import type { StatusPengajuan } from "@/types/pengajuanStok";

export type TabPengajuan = StatusPengajuan | "ALL";

/**
 * Cermin aturan backend pengajuanStokService.getAll (baris 30 sampai 47):
 * pengguna yang memegang create-transfer-stok tetapi tidak memegang
 * approve-pengajuan-stok hanya menerima status di bawah ini. Status lain
 * dijawab daftar kosong tanpa error, sehingga tab-nya disembunyikan.
 * Perbarui bersama bila aturan di service berubah.
 */
export const STATUS_PETUGAS_TRANSFER: readonly StatusPengajuan[] = ["SUBMITTED", "APPROVED", "PENDING", "COMPLETED"];

/** Status yang boleh dilihat, atau null bila tidak dibatasi. */
export function statusTerlihat(permissions: readonly string[]): readonly StatusPengajuan[] | null {
  const bolehSetujui = permissions.includes("approve-pengajuan-stok");
  const bolehTransfer = permissions.includes("create-transfer-stok");
  return !bolehSetujui && bolehTransfer ? STATUS_PETUGAS_TRANSFER : null;
}

/** Tab yang ditampilkan: "ALL" selalu, status lain hanya bila boleh dilihat. */
export function tabTerlihat(tab: readonly TabPengajuan[], permissions: readonly string[]): TabPengajuan[] {
  const terlihat = statusTerlihat(permissions);
  return tab.filter((t) => t === "ALL" || !terlihat || terlihat.includes(t));
}