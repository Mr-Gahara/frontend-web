"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { AkunAdmin, BuatAkunKlienPayload } from "@/types/adminAkun";
import { adminAkunApi } from "./api";

/** Callback halaman (toast, pengalihan). Invalidasi diurus hook. */
type OpsiMutasi<H, V> = Pick<UseMutationOptions<H, Error, V>, "onSuccess" | "onError">;

/**
 * Seluruh akun platform, termasuk akun admin (keputusan PA7a). Backend
 * mengirimnya sekali muat tanpa paginasi, sehingga pencarian dan filter
 * dilakukan di klien dari satu cache.
 */
export function useDaftarAkun() {
  return useQuery({
    queryKey: queryKeys.adminAkun.daftar(),
    queryFn: adminAkunApi.daftar,
  });
}

/** Invalidasi akar ditunggu sebelum callback, agar daftar sudah termuat ulang saat halaman berpindah. */
export function useBuatAkunKlien(opsi: OpsiMutasi<AkunAdmin, BuatAkunKlienPayload> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BuatAkunKlienPayload) => adminAkunApi.buat(payload),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminAkun.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}