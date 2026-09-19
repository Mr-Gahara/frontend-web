export interface ResepItem {
  bahanBakuID: string;
  jumlah: number;
  satuan: "gram" | "ml" | "pcs" | "kg" | "liter";
}

/** Pajak yang melekat pada produk, hasil lookup di produkService. */
export interface PajakProduk {
  id: string;
  namaPajak: string;
}

export interface Produk {
  id: string;
  namaProduk: string;
  hargaJual: number;
  hargaDasar: number;
  stok: number;
  isUnlimitedStok?: boolean;
  /** Nama kategori hasil lookup; kosong bila kategorinya sudah dihapus. */
  kategori?: string;
  /** Id kategori mentah; produkService tidak mem-populate field ini. */
  kategoriID: string;
  keterangan?: string;
  gambarProduk?: string | null;
  resep: ResepItem[];
  pajakList: PajakProduk[];
  /** Bernilai null pada respons detail. */
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProdukRequest {
  namaProduk: string;
  hargaJual: number;
  hargaDasar: number;
  kategoriID: string;
  stok?: number;
  isUnlimitedStok?: boolean;
  keterangan?: string;
  gambarProduk?: string;
  resep?: ResepItem[];
}
