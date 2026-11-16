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

/** Ringkasan tunai selama sesi; hanya di GET /sesikasir/:id (sesiKasirService.getById). */
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
  saldoSistemBuka: number;
  nominalBuka: number;
  selisihBuka: number;
  catatanBuka: string | null;
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
