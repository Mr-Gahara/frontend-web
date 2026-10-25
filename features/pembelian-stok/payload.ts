import { keTanggalLokal } from "@/lib/waktu";
import type {
  PayloadBuatPembelianStok,
  PayloadUbahPembelianStok,
  PembelianStok,
} from "@/types/pembelianStok";
import {
  angkaDariTeks,
  hargaDariTeks,
  type IsianBarangPembelian,
  type IsianCatatPembelian,
  type IsianUbahPembelian,
} from "./schema";

/** Batas pencarian supplier di backend (PANJANG_CARI_SUPPLIER, B103). */
export const PANJANG_CARI_SUPPLIER = 100;

export function barisBarangKosong(): IsianBarangPembelian {
  return { bahanBakuID: "", jumlah: "", hargaBeli: "" };
}

export function isianAwalCatat(hariIni: string): IsianCatatPembelian {
  return {
    supplier: "",
    nomorFaktur: "",
    akunKasID: "",
    tanggal: hariIni,
    keterangan: "",
    items: [barisBarangKosong()],
  };
}

/** Subtotal satu baris isian, atau null selama jumlah atau harganya belum sah. */
export function subtotalBaris(item: IsianBarangPembelian): number | null {
  const jumlah = angkaDariTeks(item.jumlah);
  const harga = hargaDariTeks(item.hargaBeli);
  return Number.isFinite(jumlah) && Number.isFinite(harga) ? jumlah * harga : null;
}

/** Total isian dari baris yang sudah sah; baris yang belum sah dihitung 0. */
export function totalIsian(items: readonly IsianBarangPembelian[]): number {
  return items.reduce((total, item) => total + (subtotalBaris(item) ?? 0), 0);
}

/**
 * Body POST /pembelianstok. Lokasi penerima selalu lokasi ruang tempat
 * pembelian dicatat. Nomor faktur kosong tidak dikirim, agar server memberi
 * nomor otomatis. Tanggal hanya dikirim Owner yang memilih hari selain hari
 * ini (aturan 17 Oktober 2026 untuk beban dan jurnal transfer, yang belum
 * ditegakkan backend untuk pembelian); selain itu server memakai waktu
 * sekarang, sehingga jam pencatatan ikut tersimpan.
 */
export function payloadBuatPembelian(
  isian: IsianCatatPembelian,
  locationID: string,
  owner: boolean,
  hariIni: string,
): PayloadBuatPembelianStok {
  const payload: PayloadBuatPembelianStok = {
    akunKasID: isian.akunKasID,
    supplier: isian.supplier.trim(),
    keterangan: isian.keterangan.trim(),
    locationID,
    items: isian.items.map((item) => ({
      bahanBakuID: item.bahanBakuID,
      jumlah: angkaDariTeks(item.jumlah),
      hargaBeli: hargaDariTeks(item.hargaBeli),
    })),
  };
  const nomorFaktur = isian.nomorFaktur.trim();
  if (nomorFaktur) payload.nomorFaktur = nomorFaktur;
  if (owner && isian.tanggal !== hariIni) payload.tanggal = isian.tanggal;
  return payload;
}

export function isianAwalUbah(pembelian: PembelianStok): IsianUbahPembelian {
  return {
    supplier: pembelian.supplier,
    nomorFaktur: pembelian.nomorFaktur ?? "",
    tanggal: keTanggalLokal(new Date(pembelian.tanggal)),
    keterangan: pembelian.keterangan,
  };
}

/**
 * Body PUT ubah info: hanya field yang berubah dibanding data server
 * (keputusan rancangan butir 15). Spasi di tepi bukan perubahan, dan
 * tanggal hanya dikirim Owner. Objek kosong berarti tidak ada perubahan.
 */
export function payloadUbahPembelian(
  pembelian: PembelianStok,
  isian: IsianUbahPembelian,
  owner: boolean,
): PayloadUbahPembelianStok {
  const payload: PayloadUbahPembelianStok = {};
  const supplier = isian.supplier.trim();
  if (supplier !== pembelian.supplier.trim()) payload.supplier = supplier;
  const keterangan = isian.keterangan.trim();
  if (keterangan !== pembelian.keterangan.trim()) payload.keterangan = keterangan;
  const nomorFaktur = isian.nomorFaktur.trim();
  if (nomorFaktur !== (pembelian.nomorFaktur ?? "").trim()) payload.nomorFaktur = nomorFaktur;
  if (owner && isian.tanggal !== keTanggalLokal(new Date(pembelian.tanggal))) {
    payload.tanggal = isian.tanggal;
  }
  return payload;
}

export type FilterPembelian = {
  akunKasID: string;
  bahanBakuID: string;
  supplier: string;
  /** Periode atas tanggal pembelian; kosong berarti tanpa batas. */
  dari?: Date;
  sampai?: Date;
};

export const FILTER_AWAL_PEMBELIAN: FilterPembelian = { akunKasID: "", bahanBakuID: "", supplier: "" };

/**
 * Filter awal daftar per ruang: tanggal 1 bulan berjalan sampai hari ini,
 * sama dengan jurnal stok dan mutasi arus kas.
 */
export function filterAwalDaftarPembelian(sekarang: Date = new Date()): FilterPembelian {
  return {
    ...FILTER_AWAL_PEMBELIAN,
    dari: new Date(sekarang.getFullYear(), sekarang.getMonth(), 1),
    sampai: new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate()),
  };
}

/**
 * Query GET /pembelianstok (B103): hanya filter yang diisi. locationID dari
 * ruang, atau null untuk seluruh lokasi tenant (Belanja Stok di Keuangan).
 * Periode dikirim sebagai YYYY-MM-DD, yang dibaca backend sebagai hari WIB.
 * Supplier dipangkas dan dibatasi panjangnya, karena backend menolak teks
 * kosong dan teks di atas 100 karakter; query lain ditolak 400.
 */
export function filterServerPembelian(
  filter: FilterPembelian,
  locationID: string | null,
): Record<string, string> {
  const params: Record<string, string> = {};
  if (locationID) params.locationID = locationID;
  if (filter.akunKasID) params.akunKasID = filter.akunKasID;
  if (filter.bahanBakuID) params.bahanBakuID = filter.bahanBakuID;
  const supplier = filter.supplier.trim().slice(0, PANJANG_CARI_SUPPLIER);
  if (supplier) params.supplier = supplier;
  if (filter.dari) params.dari = keTanggalLokal(filter.dari);
  if (filter.sampai) params.sampai = keTanggalLokal(filter.sampai);
  return params;
}

/** Query satu halaman daftar: filter, lokasi, page, dan limit. */
export function paramDaftarPembelian(
  filter: FilterPembelian,
  locationID: string | null,
  halaman: number,
  ukuran: number,
): Record<string, string> {
  return {
    ...filterServerPembelian(filter, locationID),
    page: String(halaman),
    limit: String(ukuran),
  };
}

export function adaFilterPembelian(filter: FilterPembelian): boolean {
  return Object.keys(filterServerPembelian(filter, null)).length > 0;
}