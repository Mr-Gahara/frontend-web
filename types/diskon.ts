export type DiskonCakupan = "Global" | "Item";
export type DiskonTipe = "persen" | "nominal";
export type DiskonStatus = "Aktif" | "Non-Aktif";
 
export interface Diskon {
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
  data: Diskon[];
}
 
export interface DiskonResponse {
  data: Diskon;
}
