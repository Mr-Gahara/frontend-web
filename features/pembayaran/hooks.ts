"use client";

import { useQuery } from "@tanstack/react-query";
import { pembayaranApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Seluruh pembayaran tenant: GET /pembayaran hanya membaca tenantID dan tidak
 * dapat disaring per penjualan. Kunci daftar() berbeda dari akar
 * pembayaran.semua yang masih diisi halaman lama dengan data mentah
 * (keputusan rancangan butir 12).
 */
export function useDaftarPembayaran(aktif = true) {
  return useQuery({
    queryKey: queryKeys.pembayaran.daftar(),
    queryFn: pembayaranApi.daftar,
    enabled: aktif,
  });
}