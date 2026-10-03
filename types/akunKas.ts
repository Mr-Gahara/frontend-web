// types/akunKas.ts

export type AkunKasTipe = "Kas Fisik" | "Rekening Bank";
export type AkunKasStatus = "aktif" | "non-aktif";

/**
 * Bentuk respons GET /akunkas setelah dinormalkan lib/api/client.ts
 * (kontrak/endpoint.md bagian 3.3).
 */
export interface AkunKas {
  id: string;
  tenantID: string;
  namaAkun: string;
  nomorAkun: string;
  saldo: number;
  tipeAkun: AkunKasTipe;
  status: AkunKasStatus;
  keterangan: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Ringkasan akun kas di dalam respons metode pembayaran (mapper backend). */
export interface AkunKasRef {
  id: string;
  namaAkun: string | null;
  nomorAkun: string | null;
}

// Tipe payload untuk form Create & Update Akun Kas
export interface AkunKasRequest {
  namaAkun: string;
  nomorAkun: string;
  tipeAkun: AkunKasTipe;
  saldo?: number; // Opsional saat update
  status?: AkunKasStatus;
  keterangan?: string;
}

export type ArahMutasi = "MASUK" | "KELUAR";

/** Kunci JENIS_MUTASI backend (models/akunKasModel.js); arah mengikuti jenisnya. */
export type JenisMutasi =
  | "SALDO_AWAL"
  | "PEMBAYARAN"
  | "VOID_PEMBAYARAN"
  | "BEBAN"
  | "PEMBALIK_BEBAN"
  | "TRANSFER_KELUAR"
  | "TRANSFER_MASUK"
  | "VOID_TRANSFER_KELUAR"
  | "VOID_TRANSFER_MASUK";

/**
 * Satu baris buku mutasi kas (GET /akunkas/mutasi). tanggal adalah tanggal
 * transaksi untuk ditampilkan; urutan buku dan filter periode memakai
 * createdAt, waktu saldo benar-benar berubah.
 */
export interface MutasiKas {
  id: string;
  akunKasID: string;
  jenis: JenisMutasi;
  arah: ArahMutasi;
  jumlah: number;
  saldoSebelum: number;
  saldoSesudah: number;
  referensi: { tipe: string | null; id: string | null };
  mutasiAsalID: string | null;
  keterangan: string;
  tanggal: string;
  penggunaID: string | null;
  createdAt: string;
}

/** Respons GET /akunkas/:id/ringkasan untuk satu periode. */
export interface RingkasanMutasi {
  saldoAwalPeriode: number;
  totalMasuk: number;
  totalKeluar: number;
  totalLunas: number;
  totalVoid: number;
  totalKeluarLain: number;
  saldoAkhirPeriode: number;
}
