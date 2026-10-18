"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { PayloadKategoriBeban } from "@/types/bebanOperasional";
import { kategoriBebanApi } from "./api";

type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/**
 * Daftar kategori beban, dipakai halaman kategori, form catat dan ubah beban,
 * dan filter daftar beban (keputusan rancangan butir 12). aktif false
 * mematikan permintaan bagi pengguna tanpa read-kategori-beban.
 */
export function useDaftarKategoriBeban(aktif = true) {
  return useQuery({
    queryKey: queryKeys.kategoriBeban.daftar(),
    queryFn: kategoriBebanApi.daftar,
    enabled: aktif,
  });
}

/**
 * Daftar dan detail beban menampilkan nama kategori, sehingga akar beban ikut
 * diinvalidasi. Invalidasi ditunggu sebelum callback, agar dialog tertutup
 * setelah daftar termuat ulang.
 */
function useInvalidasiKategori() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.kategoriBeban.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.bebanOperasional.semua }),
    ]);
}

export function useBuatKategoriBeban(opsi: Callback = {}) {
  const invalidasi = useInvalidasiKategori();
  return useMutation({
    mutationFn: kategoriBebanApi.buat,
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function useUbahKategoriBeban(opsi: Callback = {}) {
  const invalidasi = useInvalidasiKategori();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PayloadKategoriBeban }) =>
      kategoriBebanApi.ubah(id, payload),
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}

export function useHapusKategoriBeban(opsi: Callback = {}) {
  const invalidasi = useInvalidasiKategori();
  return useMutation({
    mutationFn: (id: string) => kategoriBebanApi.hapus(id),
    onSuccess: async () => {
      await invalidasi();
      opsi.onSuccess?.();
    },
    onError: (err) => opsi.onError?.(err),
  });
}