import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { isNotFound } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import { stockAdjustmentApi } from "./api";

/**
 * Satu halaman stock adjustment dari server (B106, B108, B109). params null
 * berarti lingkup belum siap, sehingga tidak ada permintaan. Halaman
 * sebelumnya tetap tampil selama halaman berikutnya dimuat.
 */
export function useHalamanStockAdjustment(params: Record<string, string> | null) {
  return useQuery({
    queryKey: queryKeys.stockAdjustment.daftar(params ?? undefined),
    queryFn: () => stockAdjustmentApi.halaman(params ?? {}),
    enabled: params !== null,
    placeholderData: keepPreviousData,
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
