"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pembayaranApi } from "./api";
import { susunPayloadBatalPembayaran } from "./payload";
import { queryKeys } from "@/lib/queryKeys";
import type { PembayaranRequest } from "@/types/pembayaran";

type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/**
 * Membatalkan (VOID) satu pembayaran. Backend mengurangi saldo akun kas,
 * membuka kembali tagihan penjualan, dan menolak bila saldo tidak cukup,
 * sehingga penjualan, pembayaran, dan akun kas diinvalidasi.
 */
export function useBatalkanPembayaran({ onSuccess, onError }: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, alasan }: { id: string; alasan: string }) =>
      pembayaranApi.batalkan(id, susunPayloadBatalPembayaran(alasan)),
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