import { useQuery } from "@tanstack/react-query";
import { isNotFound } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import { stockAdjustmentApi, type FilterAdjustment } from "./api";

/**
 * Daftar stock adjustment. filter null berarti lingkup belum siap, sehingga
 * tidak ada permintaan; filter tanpa locationID berarti seluruh lokasi, dan
 * halaman wajib menyaring tipe lokasinya sendiri.
 */
export function useDaftarStockAdjustment(filter: FilterAdjustment | null) {
  return useQuery({
    queryKey: queryKeys.stockAdjustment.daftar(filter ?? undefined),
    queryFn: () => stockAdjustmentApi.daftar(filter ?? {}),
    enabled: filter !== null,
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