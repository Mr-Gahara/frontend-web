/**
 * Beban operasional dan kategori beban, sesuai mappers/bebanOperasionalMapper.js
 * dan docs/api backend ridho 00de455. Beban adalah pengeluaran toko di luar
 * pembelian stok yang dibayar dari satu akun kas.
 */

export type StatusBeban = "AKTIF" | "VOID";

/** Relasi pengguna di respons beban. */
export interface PenggunaBeban {
  id: string;
  nama: string | null;
}

/** Akun kas sumber pembayaran beban. */
export interface AkunKasBeban {
  id: string;
  namaAkun: string | null;
  nomorAkun: string | null;
}

/** Kategori yang melekat pada beban. */
export interface KategoriDiBeban {
  id: string;
  namaKategori: string | null;
}

/**
 * Satu beban (GET /bebanoperasional). Beban lama tanpa status dijawab AKTIF
 * oleh backend; alasanVoid, divoidOleh, dan tanggalVoid null selama AKTIF.
 * Relasi yang sudah terhapus bernilai null.
 */
export interface BebanOperasional {
  id: string;
  tanggal: string;
  akunKas: AkunKasBeban | null;
  kategori: KategoriDiBeban | null;
  jumlah: number;
  keterangan: string | null;
  status: StatusBeban;
  alasanVoid: string | null;
  divoidOleh: PenggunaBeban | null;
  tanggalVoid: string | null;
  dicatatOleh: PenggunaBeban | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Kategori beban (GET /kategoribeban). Backend mengirim dokumen tanpa mapper;
 * _id dinormalkan menjadi id oleh lib/api/client.ts.
 */
export interface KategoriBeban {
  id: string;
  namaKategori: string;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}

/** Body POST /bebanoperasional; tenantID dan dicatatOleh diisi server dari sesi. */
export interface PayloadBuatBeban {
  akunKasID: string;
  kategoriBebanID: string;
  jumlah: number;
  /** YYYY-MM-DD hari lokal. */
  tanggal: string;
  keterangan: string;
}

/** Body PUT /bebanoperasional/:id untuk mengubah; minimal satu field. */
export interface PayloadUbahBeban {
  keterangan?: string;
  kategoriBebanID?: string;
}

/** Body PUT /bebanoperasional/:id untuk membatalkan; tidak boleh digabung field lain. */
export interface PayloadBatalBeban {
  status: "VOID";
  alasanVoid: string;
}

/** Body POST dan PUT /kategoribeban. */
export interface PayloadKategoriBeban {
  namaKategori: string;
}