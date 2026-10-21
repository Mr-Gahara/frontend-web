import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { jurnalStokApi } from "./api";
import { paramHalamanJurnal, type KriteriaServerJurnal } from "./filter";

/**
 * Satu halaman jurnal stok dari server (B102). kriteria null berarti lokasi
 * belum diketahui, sehingga tidak ada permintaan. Halaman sebelumnya tetap
 * tampil selama halaman berikutnya dimuat.
 */
export function useHalamanJurnalStok(
  kriteria: KriteriaServerJurnal | null,
  halaman: number,
  ukuran: number,
) {
  const params = kriteria ? paramHalamanJurnal(kriteria, halaman, ukuran) : null;
  return useQuery({
    queryKey: queryKeys.jurnalStok.daftar(params ?? undefined),
    queryFn: () => jurnalStokApi.halaman(params ?? {}),
    enabled: params !== null,
    placeholderData: keepPreviousData,
  });
}
