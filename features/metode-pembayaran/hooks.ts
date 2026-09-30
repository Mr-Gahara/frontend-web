"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { metodePembayaranApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import { isNotFound } from "@/lib/api/error";
import type { MetodePembayaranBaru, PerubahanMetodePembayaran } from "@/types/metodePembayaran";

/** Callback halaman untuk toast dan navigasi, sama dengan akun kas dan penjualan (butir 13). */
type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/**
 * Daftar metode pembayaran. Tanpa opsi: metode aktif saja, untuk pilihan
 * kasir (pembayaran penjualan). Dengan semua: true: termasuk yang nonaktif,
 * untuk halaman kelola (keputusan PO2a). Keduanya berada di bawah akar
 * metodePembayaran.semua, sehingga satu invalidasi memuat ulang keduanya.
 */
export function useDaftarMetodePembayaran(opsi: { semua?: boolean } = {}) {
  const semua = opsi.semua === true;
  return useQuery({
    queryKey: queryKeys.metodePembayaran.daftar(semua ? { semua: true } : undefined),
    queryFn: semua ? metodePembayaranApi.daftarSemua : metodePembayaranApi.daftar,
  });
}

/** Detail untuk form ubah: dimuat ulang setiap halaman dibuka (butir 8), tanpa mengulang 404. */
export function useMetodePembayaran(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.metodePembayaran.detail(id ?? ""),
    queryFn: () => metodePembayaranApi.detail(id as string),
    enabled: !!id,
    refetchOnMount: "always",
    retry: (jumlah, galat) => !isNotFound(galat) && jumlah < 3,
  });
}

/**
 * Buat dan perbarui menunggu invalidasi akar metode pembayaran sebelum
 * callback halaman, agar daftar sudah termuat ulang saat halaman berpindah
 * atau dialog tertutup.
 */
export function useBuatMetodePembayaran(opsi: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MetodePembayaranBaru) => metodePembayaranApi.buat(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.metodePembayaran.semua });
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function usePerbaruiMetodePembayaran(opsi: Callback = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PerubahanMetodePembayaran }) =>
      metodePembayaranApi.perbarui(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.metodePembayaran.semua });
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}
