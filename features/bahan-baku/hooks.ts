"use client";

/**
 * Hook data bahan baku.
 *
 * Invalidasi menyertakan inventory karena backend menginjeksi stok awal ke
 * sana saat bahan baku dibuat atau diperbarui (bahanBakuService), sehingga
 * daftar stok ikut berubah.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bahanBakuApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type { BahanBakuRequest } from "@/types/bahanBaku";

export function useDaftarBahanBaku() {
  return useQuery({
    queryKey: queryKeys.bahanBaku.daftar(),
    queryFn: bahanBakuApi.daftar,
  });
}

export function useBahanBaku(id: string) {
  return useQuery({
    queryKey: queryKeys.bahanBaku.detail(id),
    queryFn: () => bahanBakuApi.detail(id),
    enabled: !!id,
  });
}

function useInvalidasiBahanBaku() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bahanBaku.semua });
    queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semua });
  };
}

export function useBuatBahanBaku() {
  const invalidasi = useInvalidasiBahanBaku();
  return useMutation({
    mutationFn: (payload: BahanBakuRequest) => bahanBakuApi.buat(payload),
    onSuccess: invalidasi,
  });
}

export function usePerbaruiBahanBaku(id: string) {
  const invalidasi = useInvalidasiBahanBaku();
  return useMutation({
    mutationFn: (payload: BahanBakuRequest) => bahanBakuApi.perbarui(id, payload),
    onSuccess: invalidasi,
  });
}

export function useHapusBahanBaku() {
  const invalidasi = useInvalidasiBahanBaku();
  return useMutation({
    mutationFn: (id: string) => bahanBakuApi.hapus(id),
    onSuccess: invalidasi,
  });
}