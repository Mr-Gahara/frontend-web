"use client";

import { useQuery } from "@tanstack/react-query";
import { diskonApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Seluruh diskon tenant. Kunci daftar() tanpa filter sengaja berbeda dari
 * daftar({ status: "Aktif" }) yang masih diisi halaman buat reservasi dengan
 * data mentah (keputusan rancangan butir 12); penyaringan aktif ada di
 * filter.ts.
 */
export function useDaftarDiskon() {
  return useQuery({
    queryKey: queryKeys.diskon.daftar(),
    queryFn: diskonApi.daftar,
  });
}