import type { PengajuanStok, StatusPengajuan } from "@/types/pengajuanStok";
import { arahPengajuanValid } from "./arah";
import { statusDicakupTab, type TabPengajuan } from "./izin";
import { tahapPengajuan } from "./tahap";

export type RuangPengajuan = "outlet" | "gudang";

/**
 * Penyaringan daftar pengajuan di klien, per ruang. Hanya pengajuan dengan
 * arah yang benar (gudang asal ke outlet peminta, lihat arah.ts) yang tampil;
 * pengajuan yang tersimpan terbalik tidak tampil di ruang mana pun.
 * - Outlet: pencarian nomor.
 * - Gudang: tanpa draf, karena draf belum diajukan dan belum menjadi urusan
 *   gudang; pencarian nomor dan nama outlet peminta.
 */
export function saringPengajuan(data: PengajuanStok[], ruang: RuangPengajuan, kata: string): PengajuanStok[] {
  const cari = kata.trim().toLowerCase();
  return data.filter((p) => {
    if (!arahPengajuanValid(p)) return false;
    const cocokNomor = p.nomorPengajuan.toLowerCase().includes(cari);
    if (ruang === "outlet") return !cari || cocokNomor;
    if (p.status === "DRAFT") return false;
    return !cari || cocokNomor || (p.keLokasi?.nama ?? "").toLowerCase().includes(cari);
  });
}

/**
 * Status yang dikirim ke server untuk sebuah tab. Tab Semua dan tab gabungan
 * meminta tanpa status, karena backend hanya menerima satu status.
 */
export function statusServerTab(tab: TabPengajuan): StatusPengajuan | undefined {
  const status = statusDicakupTab(tab);
  return status?.length === 1 ? status[0] : undefined;
}

/** Penyaringan tab di klien, pelengkap statusServerTab. */
export function cocokTab(p: PengajuanStok, tab: TabPengajuan): boolean {
  if (tab === "PERLU_SURAT_JALAN") return tahapPengajuan(p) === "PERLU_SURAT_JALAN";
  const status = statusDicakupTab(tab);
  return !status || status.includes(p.status);
}
