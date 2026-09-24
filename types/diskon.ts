export type DiskonCakupan = "Global" | "Item";
export type DiskonTipe = "persen" | "nominal";
export type DiskonStatus = "Aktif" | "Non-Aktif";
 
/**
 * Bentuk respons GET /diskon setelah dinormalkan lib/api/client.ts
 * (kontrak/endpoint.md bagian 3.3).
 */
export interface Diskon {
  id: string;
  namaDiskon: string;
  cakupan: DiskonCakupan;
  tipe: DiskonTipe;
  nilai: number;
  bisaDigabung: boolean;
  status: DiskonStatus;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bentuk mentah untuk halaman yang belum dimigrasikan dan masih membaca
 * respons lewat lib/apiClient.ts. Dihapus saat modul diskon dimigrasikan
 * (keputusan K8, modul penjualan).
 */
export interface DiskonLama {
  _id: string;
  namaDiskon: string;
  cakupan: DiskonCakupan;
  tipe: DiskonTipe;
  nilai: number;
  bisaDigabung: boolean;
  status: DiskonStatus;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}
 
export interface DiskonRequest {
  namaDiskon: string;
  cakupan: DiskonCakupan;
  tipe: DiskonTipe;
  nilai: number;
  bisaDigabung: boolean;
  status: DiskonStatus;
}
 
export interface GetDiskonResponse {
  data: DiskonLama[];
}
 
export interface DiskonResponse {
  data: DiskonLama;
}
