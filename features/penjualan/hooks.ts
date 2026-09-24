"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { penjualanApi } from "./api";
import { filterServerPenjualan } from "./filter";
import { queryKeys } from "@/lib/queryKeys";
import type { PenjualanFilterParams } from "@/types/penjualan";

type Callback = { onSuccess?: () => void; onError?: (err: unknown) => void };

/** Daftar penjualan tenant; siap false berarti lingkup belum siap dan belum ada permintaan. */
export function useDaftarPenjualan(filter: PenjualanFilterParams, siap: boolean) {
  const params = filterServerPenjualan(filter);
  return useQuery({
    queryKey: queryKeys.penjualan.daftar(params),
    queryFn: () => penjualanApi.daftar(params),
    enabled: siap,
  });
}

function useInvalidasiPenjualan() {
  const queryClient = useQueryClient();
  // Void juga membatalkan sesi booking penjualan itu di backend.
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.penjualan.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sesiBooking.semua }),
    ]);
}

export function useVoidPenjualan({ onSuccess, onError }: Callback = {}) {
  const invalidasi = useInvalidasiPenjualan();
  return useMutation({
    mutationFn: (id: string) => penjualanApi.perbarui(id, { statusPenjualan: "VOID" }),
    onSuccess: async () => {
      await invalidasi();
      onSuccess?.();
    },
    onError,
  });
}

export function useHapusPenjualan({ onSuccess, onError }: Callback = {}) {
  const invalidasi = useInvalidasiPenjualan();
  return useMutation({
    mutationFn: (id: string) => penjualanApi.hapus(id),
    onSuccess: async () => {
      await invalidasi();
      onSuccess?.();
    },
    onError,
  });
}