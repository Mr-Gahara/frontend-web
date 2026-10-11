"use client";

/**
 * Daftar izin dan cuti tenant. aktif false mematikan permintaan bagi
 * pengguna tanpa read-izin-cuti, dan jawaban 403 tidak diulang.
 */
import { useQuery } from "@tanstack/react-query";

import { izinCutiApi } from "./api";
import { isForbidden } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";

export function useDaftarIzinCuti({ aktif = true }: { aktif?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.izinCuti.daftar(),
    queryFn: izinCutiApi.daftar,
    enabled: aktif,
    retry: (percobaan, galat) => !isForbidden(galat) && percobaan < 3,
  });
}