"use client";

/**
 * Hook data inventaris dan lokasi.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { inventoryApi, lokasiApi, type FilterInventory } from "./api";
import { lokasiTunggal } from "./lokasi";
import type { TambahInventoryPayload } from "@/types/inventory";
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
  // Berbagi kunci dengan useDaftarLokasi, sehingga keduanya memakai satu
  // permintaan. Kunci lokasi.daftar({ tipe }) sengaja tidak dipakai karena
  // halaman lama masih mengisinya lewat apiClient dengan bentuk berbeda.
  const { data, ...sisa } = useQuery({
    queryKey: queryKeys.lokasi.daftar(),
    queryFn: lokasiApi.daftar,
    staleTime: 5 * 60 * 1000,
    select: (daftar) => daftar.find((l) => l.tipe === tipe) ?? null,
  });
  return { ...sisa, lokasi: data ?? null, lokasiId: data?.id ?? "" };
}

/**
 * Daftar stok. filter null berarti belum siap (misalnya lokasi belum
 * diketahui), sehingga tidak ada permintaan; filter tanpa locationID berarti
 * seluruh lokasi.
 */
export function useDaftarInventory(filter: FilterInventory | null) {
  return useQuery({
    queryKey: queryKeys.inventory.daftar(filter ?? undefined),
    queryFn: () => inventoryApi.daftar(filter ?? {}),
    enabled: filter !== null,
  });
}

/**
 * Lokasi kerja pengguna saat ini (/location/current), diseragamkan lewat
 * lokasiTunggal karena kunci cache ini dapat terbagi dengan halaman lama.
 */
export function useLokasiAktif() {
  const { data, ...sisa } = useQuery({
    queryKey: queryKeys.lokasi.aktif(),
    queryFn: lokasiApi.aktif,
    staleTime: 5 * 60 * 1000,
  });
  const lokasi = lokasiTunggal(data);
  return { ...sisa, lokasi, lokasiId: lokasi?.id ?? "" };
}

/** Callback halaman (toast, reset dialog). Invalidasi diurus hook. */
type OpsiMutasi<V> = Pick<UseMutationOptions<unknown, Error, V>, "onSuccess" | "onError">;

export interface UbahStokMinimumVars {
  id: string;
  stokMinimum: number;
}

export interface OpnameVars {
  id: string;
  fisikAktual: number;
  catatan: string;
}

export function useUbahStokMinimum(opsi: OpsiMutasi<UbahStokMinimumVars> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stokMinimum }: UbahStokMinimumVars) =>
      inventoryApi.ubahStokMinimum(id, { stokMinimum }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

/** Opname cepat juga mencatat jurnal stok di backend, sehingga jurnal ikut dimuat ulang. */
export function useOpnameInventory(opsi: OpsiMutasi<OpnameVars> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fisikAktual, catatan }: OpnameVars) =>
      inventoryApi.opname(id, { fisikAktual, catatan }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semua });
      queryClient.invalidateQueries({ queryKey: queryKeys.jurnalStok.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export function useTambahInventory(opsi: OpsiMutasi<TambahInventoryPayload> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TambahInventoryPayload) => inventoryApi.buat(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}