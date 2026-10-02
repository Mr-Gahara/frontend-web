"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { diskonApi } from "./api";
import { queryKeys } from "@/lib/queryKeys";
import type { BuatDiskonPayload, Diskon, PerbaruiDiskonPayload } from "@/types/diskon";

/** Callback halaman (toast, dialog). Invalidasi diurus hook. */
type OpsiMutasi<V> = Pick<UseMutationOptions<Diskon, Error, V>, "onSuccess" | "onError">;

/**
 * Seluruh diskon tenant. Kunci daftar() tanpa filter (keputusan rancangan
 * butir 12): halaman diskon, buat penjualan, dan buat reservasi berbagi satu
 * cache, dan penyaringan dilakukan di klien (filter.ts dan tampilan.ts).
 */
export function useDaftarDiskon() {
  return useQuery({
    queryKey: queryKeys.diskon.daftar(),
    queryFn: diskonApi.daftar,
  });
}

/**
 * Invalidasi akar diskon ditunggu sebelum callback halaman, agar dialog baru
 * tertutup setelah daftar termuat ulang.
 */
function useInvalidasiDiskon() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.diskon.semua });
}

export function useBuatDiskon(opsi: OpsiMutasi<BuatDiskonPayload> = {}) {
  const invalidasi = useInvalidasiDiskon();
  return useMutation({
    mutationFn: (payload: BuatDiskonPayload) => diskonApi.buat(payload),
    onSuccess: async (...args) => {
      await invalidasi();
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}

export interface PerbaruiDiskonVars {
  id: string;
  payload: PerbaruiDiskonPayload;
}

/** Dipakai form ubah dan aktifkan atau nonaktifkan dari daftar (PD2a). */
export function usePerbaruiDiskon(opsi: OpsiMutasi<PerbaruiDiskonVars> = {}) {
  const invalidasi = useInvalidasiDiskon();
  return useMutation({
    mutationFn: ({ id, payload }: PerbaruiDiskonVars) => diskonApi.perbarui(id, payload),
    onSuccess: async (...args) => {
      await invalidasi();
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}
