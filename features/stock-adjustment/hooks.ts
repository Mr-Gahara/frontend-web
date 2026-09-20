import { useQuery } from "@tanstack/react-query";
import { isNotFound } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import { stockAdjustmentApi } from "./api";

export function useDaftarStockAdjustment() {
  return useQuery({
    queryKey: queryKeys.stockAdjustment.daftar(),
    queryFn: stockAdjustmentApi.daftar,
  });
}

/** Tidak mengulang permintaan bila jurnal tidak ditemukan, agar pesannya langsung tampil. */
export function useStockAdjustment(id: string) {
  return useQuery({
    queryKey: queryKeys.stockAdjustment.detail(id),
    queryFn: () => stockAdjustmentApi.detail(id),
    enabled: Boolean(id),
    retry: (jumlah, galat) => !isNotFound(galat) && jumlah < 3,
  });
}