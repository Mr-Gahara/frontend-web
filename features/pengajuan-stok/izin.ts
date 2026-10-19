import { IZIN } from "@/lib/auth/permissions";
import type { StatusPengajuan } from "@/types/pengajuanStok";

/**
 * Tab yang mencakup lebih dari satu status. Backend hanya menerima satu
 * status per permintaan (pengajuanStokService.getAll baris 97 sampai 100),
 * sehingga tab ini meminta tanpa status lalu disaring di klien
 * (filter.ts, cocokTab).
 * - DISETUJUI (outlet): APPROVED dan PENDING, dengan atau tanpa surat jalan.
 * - PERLU_SURAT_JALAN (gudang): APPROVED dan PENDING yang belum punya surat
 *   jalan (tahap.ts).
 */
export const STATUS_TAB_GABUNGAN = {
  DISETUJUI: ["APPROVED", "PENDING"],
  PERLU_SURAT_JALAN: ["APPROVED", "PENDING"],
} as const satisfies Record<string, readonly StatusPengajuan[]>;

export type TabGabungan = keyof typeof STATUS_TAB_GABUNGAN;
export type TabPengajuan = StatusPengajuan | "ALL" | TabGabungan;

function tabGabungan(tab: TabPengajuan): tab is TabGabungan {
  return Object.hasOwn(STATUS_TAB_GABUNGAN, tab);
}

/** Status yang dicakup tab, atau null untuk tab Semua. */
export function statusDicakupTab(tab: TabPengajuan): readonly StatusPengajuan[] | null {
  if (tab === "ALL") return null;
  return tabGabungan(tab) ? STATUS_TAB_GABUNGAN[tab] : [tab];
}

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
  const bolehSetujui = permissions.includes(IZIN.setujuiPengajuanStok);
  const bolehTransfer = permissions.includes(IZIN.buatTransferStok);
  return !bolehSetujui && bolehTransfer ? STATUS_PETUGAS_TRANSFER : null;
}

/** Tab yang ditampilkan: "ALL" selalu, tab lain bila salah satu statusnya boleh dilihat. */
export function tabTerlihat(tab: readonly TabPengajuan[], permissions: readonly string[]): TabPengajuan[] {
  const terlihat = statusTerlihat(permissions);
  return tab.filter((t) => {
    const status = statusDicakupTab(t);
    return !status || !terlihat || status.some((s) => terlihat.includes(s));
  });
}

/** Revisi draft dan ajukan memakai izin yang sama (route PUT dan PATCH submit). */
export function bolehUbahPengajuan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.ubahPengajuanStok);
}

export function bolehSetujuiPengajuan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.setujuiPengajuanStok);
}

export function bolehTolakPengajuan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.tolakPengajuanStok);
}

/** Surat jalan dibuat lewat POST /transferstok, yang mewajibkan create-transfer-stok. */
export function bolehBuatSuratJalan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.buatTransferStok);
}