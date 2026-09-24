"use client";

import { useQuery } from "@tanstack/react-query";
import { akunKasApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Daftar akun kas tenant. Kunci daftar() berbeda dari akar akunKas.semua yang
 * masih diisi halaman keuangan dan metode pembayaran lama dengan data mentah
 * (keputusan rancangan butir 12).
 */
export function useDaftarAkunKas() {
  return useQuery({
    queryKey: queryKeys.akunKas.daftar(),
    queryFn: akunKasApi.daftar,
  });
}