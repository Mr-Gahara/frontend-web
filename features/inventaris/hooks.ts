"use client";

/**
 * Hook data inventaris dan lokasi.
 */

import { useQuery } from "@tanstack/react-query";
import { inventoryApi, lokasiApi, type FilterInventory } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type { TipeLokasi } from "@/types/location";

export function useDaftarLokasi() {
  return useQuery({
    queryKey: queryKeys.lokasi.daftar(),
    queryFn: lokasiApi.daftar,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Lokasi pertama dengan tipe tertentu.
 *
 * Halaman outlet dan gudang masing-masing bekerja pada satu lokasi, dan
 * backend belum menyediakan endpoint untuk memilihnya secara langsung.
 */
export function useLokasiBertipe(tipe: TipeLokasi) {
  const { data, ...sisa } = useQuery({
    queryKey: queryKeys.lokasi.daftar({ tipe }),
    queryFn: lokasiApi.daftar,
    staleTime: 5 * 60 * 1000,
    select: (daftar) => daftar.find((l) => l.tipe === tipe) ?? null,
  });
  return { ...sisa, lokasi: data ?? null, lokasiId: data?.id ?? "" };
}

export function useDaftarInventory(filter: FilterInventory, aktif = true) {
  return useQuery({
    queryKey: queryKeys.inventory.daftar(filter),
    queryFn: () => inventoryApi.daftar(filter),
    enabled: aktif && !!filter.locationID,
  });
}