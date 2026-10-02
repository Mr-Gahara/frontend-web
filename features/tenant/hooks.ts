"use client";

/**
 * Hook data tenant (profil toko).
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { useSession } from "@/lib/auth/useSession";
import { queryKeys } from "@/lib/queryKeys";
import { tenantApi } from "./api";
import type { PerbaruiTenantPayload } from "@/types/tenant";

/** Callback halaman (toast). Invalidasi diurus hook. */
type OpsiMutasi<V> = Pick<UseMutationOptions<unknown, Error, V>, "onSuccess" | "onError">;

/**
 * Tenant milik sesi. Id diambil dari token pengguna; GET /tenant/:id tidak
 * memeriksa izin dan menolak id tenant lain, sehingga setiap pengguna dapat
 * membaca tenantnya sendiri. Dipakai juga sidebar dan halaman profil untuk
 * nama toko (keputusan PO15a), karena tenantName di token menjadi
 * "Toko Tidak Diketahui" setelah pin-refresh (kontrak/temuan.md butir 98).
 * Tidak meminta apa pun selama sesi belum pulih.
 */
export function useTenant() {
  const { pengguna } = useSession();
  const id = pengguna?.tenantID ?? "";
  return useQuery({
    queryKey: queryKeys.tenant.detail(id),
    queryFn: () => tenantApi.detail(id),
    enabled: id !== "",
  });
}

export interface PerbaruiTenantVars {
  id: string;
  payload: PerbaruiTenantPayload;
}

/**
 * Mengubah profil toko. Invalidasi ditunggu sebelum callback halaman, agar
 * form yang dipasang ulang dan sidebar membaca nilai yang tersimpan.
 */
export function usePerbaruiTenant(opsi: OpsiMutasi<PerbaruiTenantVars> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: PerbaruiTenantVars) => tenantApi.perbarui(id, payload),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tenant.semua });
      opsi.onSuccess?.(...args);
    },
    onError: opsi.onError,
  });
}