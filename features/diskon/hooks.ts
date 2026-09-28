"use client";

import { useQuery } from "@tanstack/react-query";
import { diskonApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Seluruh diskon tenant. Kunci daftar() tanpa filter (keputusan rancangan
 * butir 12); penyaringan aktif ada di filter.ts.
 */
export function useDaftarDiskon() {
  return useQuery({
    queryKey: queryKeys.diskon.daftar(),
    queryFn: diskonApi.daftar,
  });
}