/**
 * Aturan murni dashboard gudang. Setiap angka dihitung dengan aturan yang sama
 * dengan isi halaman tujuannya, agar angka yang diklik selalu sama dengan baris
 * yang tampil di sana.
 */
import { SLUG_TAB_PENGAJUAN } from "@/features/pengajuan-stok/tampilan";
import { SLUG_TAB_TRANSFER } from "@/features/transfer-stok/tampilan";
import { urlDenganTab } from "@/lib/tab-url";
import type { RingkasanDashboardGudang } from "@/types/dashboardGudang";
import type { Inventory } from "@/types/inventory";
import type { JurnalStok } from "@/types/jurnalStok";

/** Jumlah baris stok kritis dan jurnal yang ditampilkan. */
export const BATAS_BARIS = 5;

export interface AntreanPengajuan {
  perluTinjauan: number;
  perluSuratJalan: number;
}

/**
 * Hitungan kartu pengajuan dari GET /dashboard/gudang. Sejak B101 aturan server
 * sama dengan tab Perlu Disetujui dan Perlu Surat Jalan di daftar gudang:
 * SUBMITTED, serta APPROVED atau PENDING yang belum punya surat jalan. Server
 * menghitung kedua arah pengajuan (P8), sedangkan tab Perlu Surat Jalan gudang
 * hanya memuat permintaan, karena surat jalan pengembalian dibuat outlet
 * (AR6a). Kartu surat jalan karena itu memakai rincian permintaan (B111).
 */
export function antreanDariRingkasan(ringkasan: RingkasanDashboardGudang): AntreanPengajuan {
  return {
    perluTinjauan: ringkasan.pengajuan.menungguApproval,
    perluSuratJalan: ringkasan.pengajuan.siapDibuatSuratJalanPerArah.permintaan,
  };
}

export interface BarisStokKritis {
  id: string;
  nama: string;
  satuan: string;
  stok: number;
  stokMinimum: number;
  /** Bagian batang yang terisi, 0 sampai 1: stok dibanding batas minimum. */
  isi: number;
  habis: boolean;
}

/**
 * Barang kritis di gudang, dari yang paling mendesak. Penentunya isStokKritis
 * dari backend (inventoryMapper), tidak dihitung ulang di sini. Urutan menurut
 * stok dibanding batas minimum, lalu nama.
 */
export function stokKritis(
  daftar: Inventory[],
  batas = BATAS_BARIS,
): { baris: BarisStokKritis[]; total: number } {
  const semua = daftar
    .filter((i) => i.isStokKritis)
    .map((i) => ({
      id: i.id,
      nama: i.item?.nama || "-",
      satuan: i.item?.satuan || "",
      stok: i.stok,
      stokMinimum: i.stokMinimum,
      isi: i.stokMinimum > 0 ? Math.min(Math.max(i.stok / i.stokMinimum, 0), 1) : 0,
      habis: i.stok <= 0,
    }))
    .sort((a, b) => a.isi - b.isi || a.nama.localeCompare(b.nama, "id"));
  return { baris: semua.slice(0, batas), total: semua.length };
}

/**
 * Jurnal terbaru lokasi bertipe Gudang, terbaru dulu, tanpa mengubah array
 * masukan. Server sudah menyaring satu lokasi gudang; ini penjaga terakhir
 * agar stok outlet dan gudang tidak tercampur di panel.
 */
export function jurnalTerbaruGudang(daftar: JurnalStok[], batas = BATAS_BARIS): JurnalStok[] {
  return daftar
    .filter((j) => j.locationID?.tipe === "Gudang")
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, batas);
}

/** Halaman tujuan; path dipisah karena gerbang rute (bolehBukaRute) hanya menerima path. */
export interface Tautan {
  path: string;
  url: string;
}

function tautan(path: string, slug: string | null = null): Tautan {
  return { path, url: urlDenganTab(path, slug) };
}

export const TAUTAN_DASHBOARD_GUDANG = {
  perluTinjauan: tautan("/dashboard/gudang/pengajuanStok", SLUG_TAB_PENGAJUAN.gudang.SUBMITTED ?? null),
  perluSuratJalan: tautan("/dashboard/gudang/pengajuanStok", SLUG_TAB_PENGAJUAN.gudang.PERLU_SURAT_JALAN ?? null),
  suratJalanDraf: tautan("/dashboard/gudang/transferStok", SLUG_TAB_TRANSFER.PENDING ?? null),
  sedangDikirim: tautan("/dashboard/gudang/pengirimanStok"),
  inventaris: tautan("/dashboard/gudang/inventaris"),
  jurnal: tautan("/dashboard/gudang/jurnalStok"),
} as const;