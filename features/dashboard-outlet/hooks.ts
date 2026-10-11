"use client";

/**
 * Jumlah transaksi lunas pada satu hari (keputusan DB1a), dibaca dari
 * pagination.total GET /penjualan; null bila backend tidak mengirimnya.
 */
import { useQuery } from "@tanstack/react-query";

import { paramTransaksiLunas } from "./kartu";
import { penjualanApi } from "@/features/penjualan/api";
import { queryKeys } from "@/lib/queryKeys";

export function useJumlahTransaksiLunas(hari: Date) {
  const params = paramTransaksiLunas(hari);
  return useQuery({
    queryKey: queryKeys.penjualan.daftar({ dashboard: "transaksiLunas", ...params }),
    queryFn: () => penjualanApi.daftar(params),
    select: (halaman) => halaman.pagination?.total ?? null,
  });
}