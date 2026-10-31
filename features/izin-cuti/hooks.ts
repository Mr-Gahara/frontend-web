"use client";

/**
 * Izin dan cuti yang disetujui dan berlaku pada satu hari, disaring server
 * (B160). aktif false mematikan permintaan bagi pengguna tanpa
 * read-izin-cuti, dan jawaban 403 tidak diulang.
 */
import { useQuery } from "@tanstack/react-query";

import { izinCutiApi, type FilterIzinCuti } from "./api";
import { isForbidden } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import { keTanggalLokal } from "@/lib/waktu";

export function useIzinCutiHari(hari: Date, { aktif = true }: { aktif?: boolean } = {}) {
  const tanggal = keTanggalLokal(hari);
  const filter: FilterIzinCuti = { status: "disetujui", dari: tanggal, sampai: tanggal };
  return useQuery({
    queryKey: queryKeys.izinCuti.daftar(filter),
    queryFn: () => izinCutiApi.daftar(filter),
    enabled: aktif,
    retry: (percobaan, galat) => !isForbidden(galat) && percobaan < 3,
  });
}
