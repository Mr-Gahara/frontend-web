import { IZIN } from "@/lib/auth/permissions";
import { denganTabKritis } from "@/features/inventaris/tab-stok";
import { bolehSetujuiPengajuan, bolehBuatSuratJalan } from "@/features/pengajuan-stok/izin";
import { SLUG_TAB_PENGAJUAN } from "@/features/pengajuan-stok/tampilan";
import { bolehTinjauOpname } from "@/features/stock-opname/izin";
import { bolehTerimaSuratJalan } from "@/features/transfer-stok/izin";
import type { RingkasanDashboardGudang } from "@/types/dashboardGudang";
import { bolehTautan, fiturAktif, type AksesTautan } from "./akses";
import type { RingkasanOutlet } from "./api";
import type { Pemberitahuan, TingkatPemberitahuan } from "./jenis";

export const URL_STOK_OUTLET = "/dashboard/outlet/inventaris/stok";
export const URL_INVENTARIS_GUDANG = "/dashboard/gudang/inventaris";
const URL_PENGAJUAN_GUDANG = "/dashboard/gudang/pengajuanStok";
const URL_PENGAJUAN_OUTLET = "/dashboard/outlet/inventaris/pengajuanStok";
const URL_PENERIMAAN_OUTLET = "/dashboard/outlet/inventaris/penerimaanBarang";
const URL_PENERIMAAN_GUDANG = "/dashboard/gudang/penerimaanStok";
const URL_OPNAME_OUTLET = "/dashboard/outlet/inventaris/stockOpname";
const URL_OPNAME_GUDANG = "/dashboard/gudang/stockOpname";

const denganTab = (path: string, slug: string | undefined) => (slug ? `${path}?tab=${slug}` : path);

/** Data sumber inventaris dan gudang; null berarti tidak dimuat (izin, plan) atau belum termuat. */
export interface DataInventaris {
  /** GET /dashboard/outlet; sumber utama hitungan per arah (LN7a). */
  ringkasanOutlet: RingkasanOutlet | null;
  /** GET /dashboard/gudang; hanya bagi pengguna tanpa izin dashboard outlet (LN17a, B382). */
  ringkasanGudang: RingkasanDashboardGudang | null;
  /** Bahan di lokasi Gudang yang mencapai stok minimum. */
  stokKritisGudang: number | null;
  opnameMenunggu: { outlet: number | null; gudang: number | null };
}

function kartu(
  id: string,
  tingkat: TingkatPemberitahuan,
  judul: string,
  isi: string,
  tautan: { href: string; label: string } | null,
  akses: AksesTautan,
): Pemberitahuan {
  return { id, tingkat, judul, isi, tautan: tautan && bolehTautan(akses, tautan.href) ? [tautan] : [] };
}

/**
 * Sumber inventaris dan gudang LN4a. Setiap kartu hanya tampil bila ada
 * yang perlu dikerjakan dan pengguna boleh mengerjakannya (izin aksi
 * endpoint-nya, keputusan rancangan butir 14); tautannya disaring akses.
 * Persetujuan kedua arah ada di inbox gudang; surat jalan permintaan dibuat
 * gudang dan pengembalian dibuat outlet (AR6a); barang diterima di ruang
 * tujuan.
 */
export function pemberitahuanInventaris(data: DataInventaris, akses: AksesTautan): Pemberitahuan[] {
  const hasil: Pemberitahuan[] = [];
  const izin = akses.permissions;
  const gudang = fiturAktif(akses, "wms");
  const { ringkasanOutlet: o, ringkasanGudang: g } = data;

  const bahanOutlet = o?.inventory.stokKritis ?? 0;
  if (bahanOutlet > 0) {
    hasil.push(
      kartu(
        "bahan-minimum",
        "tindakan",
        "Stok bahan outlet menipis",
        `${bahanOutlet} bahan di outlet mencapai stok minimum.`,
        { href: denganTabKritis(URL_STOK_OUTLET), label: "Lihat stok" },
        akses,
      ),
    );
  }

  if (gudang && (data.stokKritisGudang ?? 0) > 0) {
    hasil.push(
      kartu(
        "gudang-minimum",
        "tindakan",
        "Stok gudang menipis",
        `${data.stokKritisGudang} bahan di gudang mencapai stok minimum.`,
        { href: denganTabKritis(URL_INVENTARIS_GUDANG), label: "Lihat inventaris" },
        akses,
      ),
    );
  }

  if (gudang) {
    const menunggu = o?.pengajuan.menungguApproval ?? g?.pengajuan.menungguApproval ?? 0;
    if (menunggu > 0 && bolehSetujuiPengajuan(izin)) {
      hasil.push(
        kartu(
          "pengajuan-menunggu",
          "tindakan",
          "Pengajuan stok menunggu persetujuan",
          `${menunggu} pengajuan stok menunggu ditinjau.`,
          { href: denganTab(URL_PENGAJUAN_GUDANG, SLUG_TAB_PENGAJUAN.gudang.SUBMITTED), label: "Tinjau" },
          akses,
        ),
      );
    }

    const bolehSuratJalan = bolehBuatSuratJalan(izin);
    const siapPermintaan =
      o?.pengajuan.perArah.permintaan.disetujui ?? g?.pengajuan.siapDibuatSuratJalanPerArah.permintaan ?? 0;
    if (siapPermintaan > 0 && bolehSuratJalan) {
      hasil.push(
        kartu(
          "surat-jalan-permintaan",
          "info",
          "Permintaan siap dikirim",
          `${siapPermintaan} pengajuan permintaan disetujui dan menunggu surat jalan dari gudang.`,
          {
            href: denganTab(URL_PENGAJUAN_GUDANG, SLUG_TAB_PENGAJUAN.gudang.PERLU_SURAT_JALAN),
            label: "Buat surat jalan",
          },
          akses,
        ),
      );
    }
    const siapPengembalian =
      o?.pengajuan.perArah.pengembalian.disetujui ?? g?.pengajuan.siapDibuatSuratJalanPerArah.pengembalian ?? 0;
    if (siapPengembalian > 0 && bolehSuratJalan) {
      hasil.push(
        kartu(
          "surat-jalan-pengembalian",
          "info",
          "Pengembalian siap dikirim",
          `${siapPengembalian} pengembalian disetujui dan menunggu surat jalan dari outlet.`,
          {
            href: denganTab(URL_PENGAJUAN_OUTLET, SLUG_TAB_PENGAJUAN.outlet.DISETUJUI),
            label: "Buat surat jalan",
          },
          akses,
        ),
      );
    }

    // Penerimaan di outlet hanya dari ringkasan outlet: pengguna gudang saja
    // tidak masuk ruang outlet (LN21a). Penerimaan pengembalian di gudang
    // memakai ringkasan gudang per arah bagi pengguna gudang saja (LN17a,
    // backend B382).
    const bolehTerima = bolehTerimaSuratJalan(izin);
    const keOutlet = o?.transfer.perArah.permintaan.sedangDikirim ?? 0;
    if (keOutlet > 0 && bolehTerima) {
      hasil.push(
        kartu(
          "terima-outlet",
          "info",
          "Barang dalam perjalanan ke outlet",
          `${keOutlet} surat jalan dikirim dan menunggu diterima di outlet.`,
          { href: URL_PENERIMAAN_OUTLET, label: "Terima barang" },
          akses,
        ),
      );
    }
    const keGudang =
      o?.transfer.perArah.pengembalian.sedangDikirim ?? g?.transfer.perArah.pengembalian.sedangDikirim ?? 0;
    if (keGudang > 0 && bolehTerima) {
      hasil.push(
        kartu(
          "terima-gudang",
          "info",
          "Pengembalian dalam perjalanan ke gudang",
          `${keGudang} surat jalan pengembalian dikirim dan menunggu diterima di gudang.`,
          { href: URL_PENERIMAAN_GUDANG, label: "Terima barang" },
          akses,
        ),
      );
    }
  }

  if (bolehTinjauOpname(izin)) {
    const opnameOutlet = data.opnameMenunggu.outlet ?? 0;
    if (opnameOutlet > 0) {
      hasil.push(
        kartu(
          "opname-outlet",
          "tindakan",
          "Stock opname outlet menunggu ditinjau",
          `${opnameOutlet} stock opname outlet sudah dihitung dan menunggu ditinjau.`,
          { href: URL_OPNAME_OUTLET, label: "Tinjau opname" },
          akses,
        ),
      );
    }
    const opnameGudang = gudang ? (data.opnameMenunggu.gudang ?? 0) : 0;
    if (opnameGudang > 0) {
      hasil.push(
        kartu(
          "opname-gudang",
          "tindakan",
          "Stock opname gudang menunggu ditinjau",
          `${opnameGudang} stock opname gudang sudah dihitung dan menunggu ditinjau.`,
          { href: URL_OPNAME_GUDANG, label: "Tinjau opname" },
          akses,
        ),
      );
    }
  }
  return hasil;
}

/** Izin pemuatan sumber inventaris; satu tempat agar hook dan unit test sejalan. */
export const IZIN_MUAT = {
  opname: IZIN.stockOpname,
  inventory: [IZIN.inventory, IZIN.inventoryGudang] as const,
};
