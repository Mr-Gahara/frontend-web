import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { StockAdjustment } from "@/types/stockOpname";

export const stockAdjustmentApi = {
  daftar: () => apiData.get<StockAdjustment[]>(EP.stockOpname.adjustments),
  detail: (id: string) =>
    apiData.get<StockAdjustment>(EP.stockOpname.adjustmentDetail(id)),
};