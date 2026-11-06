/**
 * Tipe sesi kasir dan Mesin Kasir (backend /api/sesikasir, B225 sampai B228,
 * B247, B250) serta perangkat login pengguna (/api/device). Bentuknya
 * mengikuti mappers/sesiKasirMapper.js dan mappers/deviceMapper.js setelah
 * normalisasi lib/api/client.ts (_id menjadi id).
 */

/** STATUS_SESI_KASIR di models/sesiKasirModel.js. */
export type StatusSesiKasir = "BUKA" | "TUTUP";

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
  installationId: string;
  akunKasID: string | null;
  akunKas: AkunKasSesiKasir | null;
  locationID: string | null;
  status: StatusSesiKasir;
  dibukaOleh: PenggunaSesiKasir | null;
  dibukaPada: string;
  ditutupOleh: PenggunaSesiKasir | null;
  ditutupPada: string | null;
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

/** DEVICE_STATUS di config/constants.js. */
export type StatusPerangkat = "pending" | "trusted" | "revoked" | "expired";

/** Perangkat login satu pengguna (mapDeviceResponse, GET /device/:userId). */
export interface PerangkatPengguna {
  id: string;
  penggunaID: string | null;
  pengguna: { id: string; nama: string; status: string } | null;
  installationId: string;
  status: StatusPerangkat;
  deviceName: string | null;
  isPrimary: boolean;
  platform: string | null;
  lastSeenAt: string | null;
}