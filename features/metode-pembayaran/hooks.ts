"use client";

import { useQuery } from "@tanstack/react-query";
import { metodePembayaranApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Daftar metode pembayaran tenant. Kunci daftar() berbeda dari akar
 * metodePembayaran.semua yang masih diisi halaman lama dengan data mentah
 * (keputusan rancangan butir 12).
 */
export function useDaftarMetodePembayaran() {
  return useQuery({
    queryKey: queryKeys.metodePembayaran.daftar(),
    queryFn: metodePembayaranApi.daftar,
  });
}