"use client";

/**
 * Hook data produk.
 *
 * Invalidasi memakai akar produk agar daftar, detail, dan relasi pajak per
 * produk (queryKeys.produk.pajak) ikut dimuat ulang, karena ketiganya berada
 * di bawah akar yang sama. Promise invalidasi dikembalikan agar mutateAsync
 * baru selesai setelah daftar termuat ulang.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { produkApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";

export function useDaftarProduk(opsi: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.produk.daftar(),
    queryFn: produkApi.daftar,
    enabled: opsi.enabled ?? true,
  });
}

export function useProduk(id: string) {
  return useQuery({
    queryKey: queryKeys.produk.detail(id),
    queryFn: () => produkApi.detail(id),
    enabled: Boolean(id),
  });
}

function useInvalidasiProduk() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.produk.semua });
}

export function useHapusProduk() {
  const invalidasi = useInvalidasiProduk();
  return useMutation({
    mutationFn: produkApi.hapus,
    onSuccess: invalidasi,
  });
}
