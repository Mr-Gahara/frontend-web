import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type { StockAdjustment } from "@/types/stockOpname";

/** Satu halaman adjustment (B105): dengan page atau limit, server mengirim pagination. */
export type HalamanStockAdjustment = { data: StockAdjustment[]; pagination: Paginasi | null };

export const stockAdjustmentApi = {
  /** params disusun paramHalamanAdjustment (filter.ts). */
  halaman: async (params: Record<string, string>): Promise<HalamanStockAdjustment> => {
    const hasil = await api.get<StockAdjustment[]>(EP.stockOpname.adjustments, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  detail: (id: string) =>
    apiData.get<StockAdjustment>(EP.stockOpname.adjustmentDetail(id)),
};
