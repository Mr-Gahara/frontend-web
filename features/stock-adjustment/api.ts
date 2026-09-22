import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { StockAdjustment } from "@/types/stockOpname";

/** Tanpa locationID, backend mengirim adjustment seluruh lokasi tenant, termasuk gudang. */
export interface FilterAdjustment {
  locationID?: string;
}

export const stockAdjustmentApi = {
  daftar: (filter: FilterAdjustment) =>
    apiData.get<StockAdjustment[]>(
      EP.stockOpname.adjustments,
      filter.locationID ? { locationID: filter.locationID } : undefined,
    ),
  detail: (id: string) =>
    apiData.get<StockAdjustment>(EP.stockOpname.adjustmentDetail(id)),
};