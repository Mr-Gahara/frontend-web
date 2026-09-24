"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pembayaranApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type { PembayaranRequest } from "@/types/pembayaran";

type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

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

/**
 * Mencatat pembayaran. Backend mengurangi sisa tagihan, menambah saldo akun
 * kas bila PAID, dan menyinkronkan total dibayar penjualan, sehingga
 * penjualan, pembayaran, dan akun kas diinvalidasi.
 */
export function useBuatPembayaran({ onSuccess, onError }: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PembayaranRequest) => pembayaranApi.buat(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.penjualan.semua }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pembayaran.semua }),
        queryClient.invalidateQueries({ queryKey: queryKeys.akunKas.semua }),
      ]);
      onSuccess?.();
    },
    onError,
  });
}