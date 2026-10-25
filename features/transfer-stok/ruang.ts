import type { TipeLokasi } from "@/types/location";
import type { TransferStok } from "@/types/transferStok";

/**
 * Ruang tempat halaman surat jalan dipasang (P8, AR2a). Pengirim surat jalan
 * adalah ruang yang bertipe sama dengan asal barang, dan penerimanya ruang
 * yang bertipe sama dengan tujuan: gudang mengirim permintaan dan menerima
 * pengembalian, outlet sebaliknya. Di ruang lawan, detail surat jalan tampil
 * baca-saja (AR11a).
 */
export type RuangSuratJalan = "gudang" | "outlet";

export interface KonfigurasiRuangSuratJalan {
  tipe: TipeLokasi;
  /** Tipe lokasi lawan ruang ini dalam perpindahan barang. */
  lawan: TipeLokasi;
  urlSuratJalan: string;
  urlPenerimaan: string;
  urlPengajuan: string;
}

export const RUANG_SURAT_JALAN: Record<RuangSuratJalan, KonfigurasiRuangSuratJalan> = {
  gudang: {
    tipe: "Gudang",
    lawan: "Outlet",
    urlSuratJalan: "/dashboard/gudang/transferStok",
    urlPenerimaan: "/dashboard/gudang/penerimaanStok",
    urlPengajuan: "/dashboard/gudang/pengajuanStok",
  },
  outlet: {
    tipe: "Outlet",
    lawan: "Gudang",
    urlSuratJalan: "/dashboard/outlet/inventaris/pengirimanBarang",
    urlPenerimaan: "/dashboard/outlet/inventaris/penerimaanBarang",
    urlPengajuan: "/dashboard/outlet/inventaris/pengajuanStok",
  },
};

/** Ruang ini pengirim surat jalan itu: asal barang bertipe ruang ini. */
export function ruangPengirim(ruang: RuangSuratJalan, t: Pick<TransferStok, "dariLokasi">): boolean {
  return t.dariLokasi?.tipe === RUANG_SURAT_JALAN[ruang].tipe;
}

/** Ruang ini penerima surat jalan itu: tujuan barang bertipe ruang ini. */
export function ruangPenerima(ruang: RuangSuratJalan, t: Pick<TransferStok, "keLokasi">): boolean {
  return t.keLokasi?.tipe === RUANG_SURAT_JALAN[ruang].tipe;
}