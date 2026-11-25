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
export function useLabaRugi(rentang: RentangLaporan, opsi: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.laporan.labaRugi(rentang),
    queryFn: () => laporanApi.labaRugi(rentang),
    enabled: opsi.enabled ?? true,
  });
}
/** Arus kas (B291). Seluruh query, termasuk akun kas dan kelompok, menjadi kunci cache. */
export function useArusKas(params: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.laporan.arusKas(params),
    queryFn: () => laporanApi.arusKas(params),
  });
}

/** Uang diterima per metode pembayaran untuk satu rentang; null berarti rentang belum sah. */
export function usePembayaranPerMetode(rentang: RentangLaporan | null) {
  return useQuery({
    queryKey: queryKeys.laporan.pembayaranPerMetode(rentang ?? undefined),
    queryFn: () => laporanApi.pembayaranPerMetode(rentang as RentangLaporan),
    enabled: rentang !== null,
  });
}
