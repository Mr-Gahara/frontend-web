"use client";

/**
 * Hook data aset.
 *
 * Status aset dihitung backend dari sesi booking Aktif yang sedang berjalan
 * (asetService._applyDynamicStatus), sehingga daftar selalu dimuat ulang saat
 * halaman dibuka. useDaftarAset memakai kunci daftar(), berbeda dari akar
 * aset.semua yang masih diisi halaman reservasi lama dengan data mentah
 * (keputusan rancangan butir 12). Invalidasi mencakup akar sesi booking,
 * karena daftar reservasi menampilkan nama aset.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { asetApi } from "./api";
import { isNotFound } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import type { AsetPayload } from "@/types/aset";

export function useDaftarAset() {
  return useQuery({
    queryKey: queryKeys.aset.daftar(),
    queryFn: asetApi.daftar,
    refetchOnMount: "always",
  });
}

/** Detail satu aset; id null berarti belum siap. Tidak mengulang saat 404. */
export function useAset(id: string | null) {
  return useQuery({
    queryKey: queryKeys.aset.detail(id ?? ""),
    queryFn: () => asetApi.detail(id ?? ""),
    enabled: !!id,
    retry: (jumlah, galat) => !isNotFound(galat) && jumlah < 3,
  });
}

function useInvalidasiAset() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.aset.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.sesiBooking.semua }),
    ]);
}

export function useSimpanAset() {
  const invalidasi = useInvalidasiAset();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: AsetPayload }) =>
      id ? asetApi.perbarui(id, data) : asetApi.buat(data),
    onSuccess: invalidasi,
  });
}

export function useHapusAset() {
  const invalidasi = useInvalidasiAset();
  return useMutation({
    mutationFn: asetApi.hapus,
    onSuccess: invalidasi,
  });
}