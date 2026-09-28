"use client";

import { useQuery } from "@tanstack/react-query";
import { laporanApi } from "./api";
import type { RentangLaporan } from "./periode";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Laba rugi per rentang. Seluruh filter, termasuk startDate dan endDate, ada
 * di dalam kunci, sehingga periode berjalan dan pembandingnya (KU5a) tidak
 * saling menimpa. Halaman lama menempelkan rentang di luar objek filter.
 */
export function useLabaRugi(rentang: RentangLaporan) {
  return useQuery({
    queryKey: queryKeys.laporan.labaRugi(rentang),
    queryFn: () => laporanApi.labaRugi(rentang),
  });
}