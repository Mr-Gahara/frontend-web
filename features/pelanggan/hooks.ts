"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { pelangganApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  BuatPelangganPayload,
  Pelanggan,
  PerbaruiPelangganPayload,
} from "@/types/pelanggan";

/** Callback halaman (toast, dialog). Invalidasi diurus hook. */
type OpsiMutasi<H, V> = Pick<UseMutationOptions<H, Error, V>, "onSuccess" | "onError">;

/**
 * Daftar pelanggan tenant, dengan kunci daftar() tanpa filter (keputusan
 * rancangan butir 12). Dipakai halaman pelanggan, buat penjualan, dan buat
 * reservasi, sehingga ketiganya berbagi satu cache.
 */
export function useDaftarPelanggan() {
  return useQuery({
    queryKey: queryKeys.pelanggan.daftar(),
    queryFn: pelangganApi.daftar,
  });
}

/**
 * Invalidasi akar pelanggan ditunggu sebelum callback halaman, agar dialog
 * baru tertutup setelah daftar termuat ulang.
 */
function useInvalidasiPelanggan() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.pelanggan.semua });
}

export function useBuatPelanggan(opsi: OpsiMutasi<Pelanggan, BuatPelangganPayload> = {}) {
  const invalidasi = useInvalidasiPelanggan();
  return useMutation({
    mutationFn: (payload: BuatPelangganPayload) => pelangganApi.buat(payload),
    onSuccess: async (...args) => {
      await invalidasi();
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export interface PerbaruiPelangganVars {
  id: string;
  payload: PerbaruiPelangganPayload;
}

/** Hasilnya pelanggan tersimpan, yang dibandingkan halaman dengan payload (PD5a). */
export function usePerbaruiPelanggan(opsi: OpsiMutasi<Pelanggan, PerbaruiPelangganVars> = {}) {
  const invalidasi = useInvalidasiPelanggan();
  return useMutation({
    mutationFn: ({ id, payload }: PerbaruiPelangganVars) => pelangganApi.perbarui(id, payload),
    onSuccess: async (...args) => {
      await invalidasi();
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export function useHapusPelanggan(opsi: OpsiMutasi<unknown, string> = {}) {
  const invalidasi = useInvalidasiPelanggan();
  return useMutation({
    mutationFn: (id: string) => pelangganApi.hapus(id),
    onSuccess: async (...args) => {
      await invalidasi();
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}
