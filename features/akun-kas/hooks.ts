"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { akunKasApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Daftar akun kas tenant, dipakai halaman keuangan, kartu ringkasan, dan
 * pembayaran penjualan. Kunci daftar() berbeda dari akar akunKas.semua yang
 * masih diisi halaman metode pembayaran lama dengan data mentah (keputusan
 * rancangan butir 12).
 */
export function useDaftarAkunKas() {
  return useQuery({
    queryKey: queryKeys.akunKas.daftar(),
    queryFn: akunKasApi.daftar,
  });
}

/** Callback halaman untuk toast dan navigasi, sama dengan penjualan dan pembayaran. */
type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/**
 * Buat akun kas. Invalidasi memakai akar akunKas.semua, karena halaman metode
 * pembayaran lama masih mengisi akar itu dengan data mentah (keputusan
 * rancangan butir 3). Toast dan navigasi dari halaman (butir 13).
 */
export function useBuatAkunKas(opsi: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: akunKasApi.buat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.akunKas.semua });
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}