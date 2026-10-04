"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { PayloadBatalTransfer } from "@/types/jurnalTransfer";
import { jurnalTransferApi } from "./api";
import { filterServerTransfer, type FilterTransfer } from "./payload";

/** Callback halaman untuk toast dan dialog, sama dengan akun kas. */
type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/**
 * Satu halaman riwayat transfer (keputusan DN2a); filter akun dan status
 * diterapkan backend bersama paginasi. Data halaman sebelumnya dipertahankan
 * selama halaman berikutnya dimuat.
 */
export function useDaftarTransfer(filter: FilterTransfer, halaman: number, ukuran: number) {
  const params = { ...filterServerTransfer(filter), page: String(halaman), limit: String(ukuran) };
  return useQuery({
    queryKey: queryKeys.jurnalTransfer.daftar(params),
    queryFn: () => jurnalTransferApi.daftar(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Transfer mengubah saldo kedua akun dan menulis dua baris buku mutasi,
 * sehingga akar akunKas ikut diinvalidasi bersama akar jurnalTransfer
 * (keputusan rancangan butir 3).
 */
function useInvalidasiTransfer() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.jurnalTransfer.semua });
    queryClient.invalidateQueries({ queryKey: queryKeys.akunKas.semua });
  };
}

export function useBuatTransfer(opsi: Callback = {}) {
  const invalidasi = useInvalidasiTransfer();
  return useMutation({
    mutationFn: jurnalTransferApi.buat,
    onSuccess: () => {
      invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function useBatalkanTransfer(opsi: Callback = {}) {
  const invalidasi = useInvalidasiTransfer();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayloadBatalTransfer }) =>
      jurnalTransferApi.batalkan(id, payload),
    onSuccess: () => {
      invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}