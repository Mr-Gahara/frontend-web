import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { CreateOpnameRequest, StatusOpname, StockOpname } from "@/types/stockOpname";
import type { ItemHitungan } from "./payload";

export interface FilterStockOpname {
  status?: StatusOpname;
  locationID?: string;
}

export const stockOpnameApi = {
  detail: (id: string) => apiData.get<StockOpname>(EP.stockOpname.detail(id)),
  buat: (payload: CreateOpnameRequest) => apiData.post<StockOpname>(EP.stockOpname.list, payload),
  simpanItem: (id: string, payload: { items: ItemHitungan[] }) =>
    apiData.patch<unknown>(EP.stockOpname.items(id), payload),
  ajukan: (id: string) => apiData.patch<unknown>(EP.stockOpname.submit(id), {}),
  setujui: (id: string, alasan: string) =>
    apiData.patch<unknown>(EP.stockOpname.approve(id), { alasan }),
  tolak: (id: string, catatanReview: string) =>
    apiData.patch<unknown>(EP.stockOpname.reject(id), { catatanReview }),
  batalkan: (id: string) => apiData.patch<unknown>(EP.stockOpname.cancel(id), {}),
  daftar: (filter: FilterStockOpname) =>
    apiData.get<StockOpname[]>(EP.stockOpname.list, {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.locationID ? { locationID: filter.locationID } : {}),
    }),
};