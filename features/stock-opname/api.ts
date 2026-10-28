import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type { CreateOpnameRequest, StockOpname } from "@/types/stockOpname";
import type { ItemHitungan } from "./payload";

/** Satu halaman stock opname (B106): dengan page atau limit, server mengirim pagination. */
export type HalamanStockOpname = { data: StockOpname[]; pagination: Paginasi | null };

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
  /** params disusun paramHalamanOpname (filter.ts). */
  halaman: async (params: Record<string, string>): Promise<HalamanStockOpname> => {
    const hasil = await api.get<StockOpname[]>(EP.stockOpname.list, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
};