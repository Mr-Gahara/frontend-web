"use client";

import { useQuery } from "@tanstack/react-query";
import { pajakApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Seluruh pajak tenant. Halaman pengaturan pajak lama mengisi akar
 * pajak.semua, bukan kunci daftar() ini (keputusan rancangan butir 12).
 */
export function useDaftarPajak() {
  return useQuery({
    queryKey: queryKeys.pajak.daftar(),
    queryFn: pajakApi.daftar,
  });
}