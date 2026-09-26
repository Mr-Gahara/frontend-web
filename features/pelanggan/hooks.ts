"use client";

import { useQuery } from "@tanstack/react-query";
import { pelangganApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Daftar pelanggan tenant. Kunci daftar() berbeda dari akar pelanggan.semua
 * yang masih diisi halaman pelanggan dan buat reservasi dengan data mentah
 * (keputusan rancangan butir 12).
 */
export function useDaftarPelanggan() {
  return useQuery({
    queryKey: queryKeys.pelanggan.daftar(),
    queryFn: pelangganApi.daftar,
  });
}