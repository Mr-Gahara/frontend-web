"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { PayloadBatalBeban, PayloadUbahBeban } from "@/types/bebanOperasional";
import { bebanApi } from "./api";
import { filterServerBeban, type FilterBeban } from "./payload";

/** Callback halaman untuk toast, dialog, dan navigasi, sama dengan jurnal transfer. */
type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/**
 * Satu halaman daftar beban (keputusan BO3a); filter diterapkan backend
 * bersama paginasi. Data halaman sebelumnya dipertahankan selama halaman
 * berikutnya dimuat.
 */
export function useDaftarBeban(filter: FilterBeban, halaman: number, ukuran: number) {
  const params = { ...filterServerBeban(filter), page: String(halaman), limit: String(ukuran) };
  return useQuery({
    queryKey: queryKeys.bebanOperasional.daftar(params),
    queryFn: () => bebanApi.daftar(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Mencatat dan membatalkan beban mengubah saldo akun kas, buku mutasi, dan
 * laba rugi, sehingga akar akunKas dan laporan ikut diinvalidasi bersama akar
 * beban (keputusan rancangan butir 3). Mengubah keterangan atau kategori
 * hanya menyentuh beban. Invalidasi ditunggu sebelum callback, agar daftar
 * sudah termuat ulang saat dialog tertutup.
 */
function useInvalidasiBeban(ikutSaldo: boolean) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.bebanOperasional.semua }),
      ...(ikutSaldo
        ? [
            queryClient.invalidateQueries({ queryKey: queryKeys.akunKas.semua }),
            queryClient.invalidateQueries({ queryKey: queryKeys.laporan.semua }),
          ]
        : []),
    ]);
}

export function useBuatBeban(opsi: Callback = {}) {
  const invalidasi = useInvalidasiBeban(true);
  return useMutation({
    mutationFn: bebanApi.buat,
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function useUbahBeban(opsi: Callback = {}) {
  const invalidasi = useInvalidasiBeban(false);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayloadUbahBeban }) =>
      bebanApi.ubah(id, payload),
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function useBatalkanBeban(opsi: Callback = {}) {
  const invalidasi = useInvalidasiBeban(true);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayloadBatalBeban }) =>
      bebanApi.batalkan(id, payload),
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}