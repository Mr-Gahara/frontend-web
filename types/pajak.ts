export type ModelPerhitungan = 1 | 2 | 3;
 
/**
 * Bentuk respons GET /pajak setelah dinormalkan lib/api/client.ts. Backend
 * mengirim _id mentah tanpa mapper; normalisasi mengubahnya menjadi id.
 */
export interface Pajak {
  id: string;
  namaPajak: string;
  tarifPajak: number;
  /** true = per produk, false = per transaksi */
  tipePajak: boolean;
  /** 1 = inclusive, 2 = exclusive, 3 = compound */
  modelPerhitungan: ModelPerhitungan;
  prioritas: number;
  statusPajak: boolean;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bentuk mentah untuk halaman yang belum dimigrasikan dan masih membaca
 * respons lewat lib/apiClient.ts. Dihapus bersama tipe Lama lain di berkas
 * ini saat modul pengaturan pajak dimigrasikan (keputusan K8, modul
 * penjualan).
 */
export interface PajakLama {
  _id: string;
  namaPajak: string;
  tarifPajak: number;
  tipePajak: boolean; // true = Per Produk, false = Per Transaksi
  modelPerhitungan: ModelPerhitungan; // 1=Inclusive, 2=Exclusive, 3=Compound
  prioritas: number;
  statusPajak: boolean;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}
 
export interface PajakRequest {
  namaPajak: string;
  tarifPajak: number;
  tipePajak: boolean;
  modelPerhitungan: ModelPerhitungan;
  prioritas: number;
  statusPajak?: boolean;
}
 
export interface GetPajakResponse {
  success: boolean;
  data: PajakLama[];
}
 
export interface PajakResponse {
  success: boolean;
  message?: string;
  data: PajakLama;
}

export interface ProdukPajakRelasiLama {
  _id: string;
  produkID: string;
  pajakID: string;
  tenantID: string;
  createdAt: string;
}
 
export interface ProdukPajakRequest {
  produkID: string;
  pajakID: string;
}
 
export interface PajakDariProdukLama {
  _id: string;
  pajak: Omit<PajakLama, "tenantID" | "createdAt" | "updatedAt">;
}
 
export interface GetPajakByProdukResponse {
  success: boolean;
  data: PajakDariProdukLama[];
}
 
export interface ProdukPajakResponse {
  success: boolean;
  data: ProdukPajakRelasiLama;
}
