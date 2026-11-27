/**
 * Tipe sesi kasir dan Mesin Kasir (backend /api/sesikasir, B225 sampai B228,
 * B247, B250, B334 sampai B336). Bentuknya mengikuti
 * mappers/sesiKasirMapper.js dan services/sesiKasirService.js setelah
 * normalisasi lib/api/client.ts (_id menjadi id).
 */

/** STATUS_SESI_KASIR di models/sesiKasirModel.js. */
export type StatusSesiKasir = "BUKA" | "TUTUP";

/** Asal penutupan sesi kasir (B336). */
export type AsalPenutupanSesi = "app" | "web";

/** Pengguna hasil populate (_pengguna di mapper). */
export interface PenggunaSesiKasir {
  id: string;
  nama: string;
}

/** Akun kas hasil populate (_akunKas di mapper): hanya nama, tanpa nomor akun. */
export interface AkunKasSesiKasir {
  id: string;
  namaAkun: string;
}

/**
 * Isi laci yang dipindah ke akun kas lain saat buka kasir (B371, _pindahDana di
 * mapper). Jurnal transfernya tidak dapat di-VOID (409, de0bf66).
 */
export interface PindahDanaBukaSesi {
  jurnalTransferID: string | null;
  akunKasTujuanID: string | null;
  akunKasTujuan: AkunKasSesiKasir | null;
  jumlah: number;
}

/** Periode struk di respons tutup (B376); null untuk sesi sebelum AR48. */
export interface PeriodeSesiTutup {
  id: string;
  status: StatusSesiKasir;
}

/**
 * Ringkasan tunai selama sesi; hanya di GET /sesikasir/:id (sesiKasirService.getById).
 * Sejak B374 tunaiMasuk dan jumlahPembayaran hanya menghitung pembayaran ke laci,
 * walau pembayaran non-tunai juga bersesi.
 */
export interface RingkasanSesiKasir {
  tunaiMasuk: number;
  jumlahPembayaran: number;
  totalSelisih: number;
}

/** Satu sesi buka-tutup kasir (mapSesiKasirResponse), untuk pemegang read-sesi-kasir. */
export interface SesiKasir {
  id: string;
  tenantID: string | null;
  /**
   * null bagi yang tidak memegang kelola-perangkat-kasir (K-19, B335);
   * mesin dikenali lewat namaPerangkat.
   */
  installationId: string | null;
  /** Nama mesin kasir saat ini dari pemetaan; null bila mesinnya dilepas (B335). */
  namaPerangkat: string | null;
  akunKasID: string | null;
  akunKas: AkunKasSesiKasir | null;
  locationID: string | null;
  status: StatusSesiKasir;
  dibukaOleh: PenggunaSesiKasir | null;
  dibukaPada: string;
  ditutupOleh: PenggunaSesiKasir | null;
  ditutupPada: string | null;
  /** Asal penutupan (B336); null selama masih buka atau ditutup sebelum 16 November 2026. */
  ditutupDari: AsalPenutupanSesi | null;
  /** Periode struk tempat sesi bergabung (B376); null untuk sesi sebelum AR48. */
  periodeKasirID: string | null;
  saldoSistemBuka: number;
  /** Modal yang ditinggal di laci; boleh 0 sejak B371. */
  nominalBuka: number;
  /** (nominalBuka + pindahDanaBuka.jumlah) − saldoSistemBuka. */
  selisihBuka: number;
  catatanBuka: string | null;
  /** null bila laci tidak dikosongkan saat buka (B371). */
  pindahDanaBuka: PindahDanaBukaSesi | null;
  saldoSistemTutup: number | null;
  nominalTutup: number | null;
  selisihTutup: number | null;
  catatanTutup: string | null;
  createdAt: string;
  updatedAt: string;
  ringkasan?: RingkasanSesiKasir;
}

/**
 * Pemetaan perangkat ke laci (mapPerangkatKasirResponse). Di layar disebut
 * Mesin Kasir (keputusan pemilik proyek, 6 November 2026); nama tipe
 * mengikuti model backend PerangkatKasir.
 */
export interface PerangkatKasir {
  id: string;
  tenantID: string | null;
  installationId: string;
  namaPerangkat: string;
  akunKasID: string | null;
  akunKas: AkunKasSesiKasir | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Perangkat trusted se-toko untuk pilihan mesin kasir (GET
 * /sesikasir/perangkat-toko, B334, kelola-perangkat-kasir): satu baris per
 * installationId. terakhirDipakai berasal dari updatedAt perangkat.
 */
export interface PerangkatToko {
  installationId: string;
  deviceName: string | null;
  platform: string | null;
  terakhirDipakai: string | null;
  pengguna: { id: string; nama: string }[];
  mesinKasir: { id: string; namaPerangkat: string } | null;
}

/** STATUS_PERIODE_KASIR backend: BUKA selama masih ada mesin kasir yang buka di outlet. */
export type StatusPeriodeKasir = "BUKA" | "TUTUP";

/**
 * Periode struk laporan tutup kasir (B375, mapPeriodeKasirResponse): gabungan
 * seluruh sesi kasir di satu outlet per shift atau hari toko (P88 butir 9).
 */
export interface PeriodeKasir {
  id: string;
  tenantID: string | null;
  locationID: string | null;
  status: StatusPeriodeKasir;
  dibukaPada: string;
  ditutupPada: string | null;
  /** Jumlah sesi yang masih buka di periode itu. */
  sesiBuka: number;
  jumlahSesi: number;
  sesiKasirIDs: string[];
  dipotretPada: string | null;
}

/** Isi struk laporan tutup kasir, dipotret saat periode ditutup (periodeKasirService.potret). */
export interface LaporanPeriodeKasir {
  toko: { namaToko: string | null; alamat: string | null; logoUrl: string | null };
  outlet: { id: string; nama: string; alamat: string | null } | null;
  kasir: string[];
  dibukaPada: string;
  ditutupPada: string;
  jumlahSesi: number;
  modalAwal: number;
  penerimaanPerMetode: { namaMetodePembayaran: string; jumlah: number }[];
  totalPenerimaanKasir: number;
  totalPenerimaanInvoice: number;
  totalPenerimaan: number;
  jendelaInvoice: { dari: string; sampai: string };
  saldoAkhir: number;
  transaksiSelesai: number;
  transaksiBelumTerbayar: number;
  totalSistem: number;
  tunaiAktual: number;
  selisih: number;
  produkTerjual: { produkID: string; namaProduk: string; jumlah: number }[];
  totalProdukTerjual: number;
}

/** Detail periode (mapPeriodeKasirDetail): laporan null selama BUKA. */
export interface PeriodeKasirDetail extends PeriodeKasir {
  laporan: LaporanPeriodeKasir | null;
}
