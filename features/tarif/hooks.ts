"use client";

/**
 * Hook data tarif.
 *
 * useDaftarTarif memakai kunci daftar(), bukan akar tarif.semua yang dipakai
 * halaman lama untuk menyimpan data (keputusan rancangan butir 3). useTarif
 * dimuat ulang setiap halaman edit dibuka, karena form edit dipasang dengan
 * defaultValues dari data itu (butir 8). Invalidasi mencakup akar tarif dan
 * tipe aset, karena daftar tipe aset menampilkan tarif terkait (dataTarif).
 * Perilaku backend yang tidak diakali di sini (butir 17): ubah tarif
 * menggabungkan tipeAsetID lewat $addToSet (kontrak/temuan.md butir 54), dan
 * hapus tarif menjawab 500 setelah datanya terhapus (butir 53).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tarifApi } from "./api";
import { isNotFound } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import type { TarifPayload } from "@/types/tarif";

export function useDaftarTarif() {
  return useQuery({
    queryKey: queryKeys.tarif.daftar(),
    queryFn: tarifApi.daftar,
  });
}

/** Detail satu tarif; id null berarti belum siap. Tidak mengulang saat 404. */
export function useTarif(id: string | null) {
  return useQuery({
    queryKey: queryKeys.tarif.detail(id ?? ""),
    queryFn: () => tarifApi.detail(id ?? ""),
    enabled: !!id,
    refetchOnMount: "always",
    retry: (jumlah, galat) => !isNotFound(galat) && jumlah < 3,
  });
}

function useInvalidasiTarif() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.tarif.semua }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tipeAset.semua }),
    ]);
}

export function useSimpanTarif() {
  const invalidasi = useInvalidasiTarif();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: TarifPayload }) =>
      id ? tarifApi.perbarui(id, data) : tarifApi.buat(data),
    onSuccess: invalidasi,
  });
}

export function useHapusTarif() {
  const invalidasi = useInvalidasiTarif();
  return useMutation({
    mutationFn: tarifApi.hapus,
    onSuccess: invalidasi,
  });
}