export interface ResepItem {
  bahanBakuID: string;
  jumlah: number;
  satuan: "gram" | "ml" | "pcs" | "kg" | "liter";
}
 
export interface KategoriPopulated {
  _id: string;
  namaKategori: string;
}
 
export interface Produk {
  _id: string;
  namaProduk: string;
  hargaJual: number;
  hargaDasar: number;
  stok: number;
  isUnlimitedStok?: boolean;
  kategori?: String;
  kategoriID: string | KategoriPopulated;
  keterangan?: string;
  gambarProduk?: string | null;
  resep: ResepItem[];
  pajak: string[];
  tenantID: string;
  createdAt: string;
  updatedAt: string;
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
 
export interface GetProdukResponse {
  success: boolean;
  data: Produk[];
}
 
export interface ProdukResponse {
  success: boolean;
  data: Produk;
}

export interface GetKategoriResponse {
  success: boolean;
  data: KategoriPopulated[];
}