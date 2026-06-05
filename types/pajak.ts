export type ModelPerhitungan = 1 | 2 | 3;
 
export interface Pajak {
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
  data: Pajak[];
}
 
export interface PajakResponse {
  success: boolean;
  message?: string;
  data: Pajak;
}

export interface ProdukPajakRelasi {
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
 
export interface PajakDariProduk {
  _id: string;
  pajak: Omit<Pajak, "tenantID" | "createdAt" | "updatedAt">;
}
 
export interface GetPajakByProdukResponse {
  success: boolean;
  data: PajakDariProduk[];
}
 
export interface ProdukPajakResponse {
  success: boolean;
  data: ProdukPajakRelasi;
}
