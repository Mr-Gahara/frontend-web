export interface Kategori {
  _id: string;
  namaKategori: string;
  kodeKategori: string;
  keterangan?: string;
  tenantID: string;
  createdAt: string;
  updatedAt: string;
}
 
export interface KategoriRequest {
  namaKategori: string;
  kodeKategori: string;
  keterangan?: string;
}
 
export interface GetKategoriResponse {
  data: Kategori[];
}
 
export interface KategoriResponse {
  message: string;
  data: Kategori;
}
