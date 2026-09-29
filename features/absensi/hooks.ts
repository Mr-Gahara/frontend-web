"use client";

/**
 * Monitoring absensi harian. Untuk hari ini data dimuat ulang setiap 30
 * detik, sama dengan hook lama dan sama dengan masa cache backend. Jawaban
 * 403 tidak diulang, agar pesan izin langsung tampil (keputusan AB3a).
 */
import { useQuery } from "@tanstack/react-query";
import { absensiApi } from "./api";
import { isForbidden } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import { keTanggalLokal } from "@/lib/waktu";

export function useMonitoringAbsensi(tanggal: Date) {
  const tanggalStr = keTanggalLokal(tanggal);
  const hariIni = tanggalStr === keTanggalLokal(new Date());
  return useQuery({
    queryKey: queryKeys.absensi.monitoring(tanggalStr),
    queryFn: () => absensiApi.monitoring(tanggalStr),
    refetchInterval: hariIni ? 30_000 : false,
    retry: (percobaan, galat) => !isForbidden(galat) && percobaan < 3,
  });
}