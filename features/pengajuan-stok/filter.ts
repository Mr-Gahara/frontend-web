import { queryCari, type LingkupLokasi } from "@/features/inventaris/cakupan";
import type { StatusPengajuan } from "@/types/pengajuanStok";
import type { ArahPengajuan } from "./arah";
import { statusDicakupTab, type TabPengajuan } from "./izin";

export type RuangPengajuan = "outlet" | "gudang";

/** Filter arah daftar (AR4a): semua arah, atau satu arah. */
export type FilterArah = "SEMUA" | ArahPengajuan;

/** Seluruh status kecuali draf: tab Semua gudang, karena draf belum menjadi urusan gudang. */
export const STATUS_TANPA_DRAF: readonly StatusPengajuan[] = ["SUBMITTED", "APPROVED", "PENDING", "REJECTED", "COMPLETED"];

/** Tipe lokasi asal tiap arah (P8): permintaan dari Gudang, pengembalian dari Outlet. */
const TIPE_ASAL: Record<ArahPengajuan, string> = { GUDANG_KE_OUTLET: "Gudang", OUTLET_KE_GUDANG: "Outlet" };
/** Tipe lokasi ruang, yang membuat surat jalan untuk pengajuan berasal dari ruang itu. */
const TIPE_RUANG: Record<RuangPengajuan, string> = { gudang: "Gudang", outlet: "Outlet" };

export interface KriteriaPengajuan {
  ruang: RuangPengajuan;
  tab: TabPengajuan;
  arah: FilterArah;
  lingkup: LingkupLokasi;
  cari: string;
  /** statusTerlihat (izin.ts): null bila pengguna tidak dibatasi. */
  statusTerlihat: readonly StatusPengajuan[] | null;
}

/**
 * Query satu halaman daftar pengajuan (B104, B108, B109, B110). Seluruh
 * penyaringan dilakukan server, sehingga pagination.total benar (keputusan
 * rancangan butir 27):
 * - Tab dikirim sebagai status, tab gabungan dipisah koma. Tab Semua di
 *   outlet tanpa status; di gudang seluruh status selain draf yang boleh
 *   dilihat pengguna.
 * - Perlu Surat Jalan: suratJalan=belum, dan hanya pengajuan yang surat
 *   jalannya dibuat ruang ini, yaitu berasal dari tipe lokasi ruang (AR6a).
 * - Filter arah dikirim sebagai dariTipeLokasi; satu lokasi sebagai
 *   locationID (asal maupun tujuan). Lingkup bertipe tidak perlu dikirim,
 *   karena setiap pengajuan selalu antara Gudang dan Outlet (P8).
 * - Pencarian nomor atau nama lokasi asal maupun tujuan (cakupan backend,
 *   keputusan pemilik proyek 28 Oktober 2026).
 * Pasangan lokasi yang tidak sah tidak lagi disaring, karena validasi arah
 * ditutup backend (kontrak/temuan.md butir 24). null berarti filter arah
 * bertentangan dengan tab Perlu Surat Jalan, sehingga hasilnya pasti kosong
 * dan tidak perlu diminta.
 */
export function paramHalamanPengajuan(
  k: KriteriaPengajuan,
  halaman: number,
  ukuran: number,
): Record<string, string> | null {
  const params: Record<string, string> = { page: String(halaman), limit: String(ukuran) };
  const status =
    k.tab === "ALL"
      ? k.ruang === "gudang"
        ? STATUS_TANPA_DRAF.filter((s) => !k.statusTerlihat || k.statusTerlihat.includes(s))
        : null
      : statusDicakupTab(k.tab);
  if (status) params.status = status.join(",");
  let tipeAsal = k.arah === "SEMUA" ? undefined : TIPE_ASAL[k.arah];
  if (k.tab === "PERLU_SURAT_JALAN") {
    params.suratJalan = "belum";
    const asalRuang = TIPE_RUANG[k.ruang];
    if (tipeAsal && tipeAsal !== asalRuang) return null;
    tipeAsal = asalRuang;
  }
  if (tipeAsal) params.dariTipeLokasi = tipeAsal;
  if (k.lingkup.locationID) params.locationID = k.lingkup.locationID;
  return { ...params, ...queryCari(k.cari) };
}
