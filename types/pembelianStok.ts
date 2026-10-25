/**
 * Pembelian stok, sesuai models/pembelianStokModel.js dan
 * services/pembelianStokService.js backend ridho b5b367a. Backend mengirim
 * dokumen tanpa mapper; _id dinormalkan menjadi id oleh lib/api/client.ts.
 * Pembelian menambah stok bahan di lokasi penerima (P17 backend), tetapi
 * belum mengurangi saldo akun kas dan belum menulis buku mutasi kas.
 */

/** Akun kas pembayar, di-populate di daftar dan detail. */
export interface AkunKasPembelian {
  id: string;
  namaAkun: string;
  nomorAkun: string;
}

/** Bahan baku di setiap barang, di-populate di daftar dan detail. */
export interface BahanDiPembelian {
  id: string;
  namaBahan: string;
  satuan: string;
}

/** Pencatat pembelian, di-populate di daftar dan detail. */
export interface PencatatPembelian {
  id: string;
  nama: string;
}

/**
 * Satu barang pembelian. Bahan yang sudah terhapus bernilai null setelah
 * populate. subtotal dihitung server dari jumlah kali hargaBeli.
 */
export interface ItemPembelianStok {
  bahanBakuID: BahanDiPembelian | null;
  jumlah: number;
  hargaBeli: number;
  subtotal: number;
}

/**
 * Satu pembelian dari GET /pembelianstok dan GET /pembelianstok/:id.
 * locationID tidak di-populate, sehingga nama lokasi dibaca dari daftar
 * lokasi. stokDitambahkan false menandai pembelian sebelum P17 backend,
 * yang tidak pernah menambah stok dan dihapus tanpa menyentuh stok.
 */
export interface PembelianStok {
  id: string;
  tanggal: string;
  akunKasID: AkunKasPembelian | null;
  supplier: string;
  keterangan: string;
  items: ItemPembelianStok[];
  totalBiaya: number;
  locationID: string | null;
  nomorFaktur: string | null;
  dicatatOleh: PencatatPembelian | null;
  stokDitambahkan: boolean;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}

/** Respons POST dan PUT: dokumen tanpa populate, relasinya berupa id. */
export interface PembelianStokTersimpan
  extends Omit<PembelianStok, "akunKasID" | "items" | "dicatatOleh"> {
  akunKasID: string;
  items: { bahanBakuID: string; jumlah: number; hargaBeli: number; subtotal: number }[];
  dicatatOleh: string;
}

/** Satu barang di body POST. */
export interface ItemPayloadPembelian {
  bahanBakuID: string;
  jumlah: number;
  hargaBeli: number;
}

/**
 * Body POST /pembelianstok. tenantID dan dicatatOleh diisi server dari
 * sesi; subtotal dan totalBiaya dihitung server.
 */
export interface PayloadBuatPembelianStok {
  akunKasID: string;
  supplier: string;
  keterangan: string;
  locationID: string;
  items: ItemPayloadPembelian[];
  /** Tidak dikirim bila kosong; server memberi nomor INV/YYYYMMDD/HHmmssSSS. */
  nomorFaktur?: string;
  /** YYYY-MM-DD hari lokal; tanpa itu server memakai waktu sekarang. */
  tanggal?: string;
}

/**
 * Body PUT /pembelianstok/:id: hanya field ini yang diterima (B76). items,
 * locationID, dan akunKasID ditolak 400; yang keliru dihapus lalu dicatat
 * ulang.
 */
export interface PayloadUbahPembelianStok {
  supplier?: string;
  keterangan?: string;
  nomorFaktur?: string;
  tanggal?: string;
}