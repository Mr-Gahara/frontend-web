// hooks/useMonitoringAbsensi.ts
import { useQuery } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { apiClient } from "@/lib/apiClient";
import { queryKeys } from "@/lib/queryKeys";
import type { MonitoringAbsensiResponse } from "@/types/absensi";

export function useMonitoringAbsensi(tanggal: Date) {
  const tanggalStr = format(tanggal, "yyyy-MM-dd");

  return useQuery({
    queryKey: queryKeys.absensiMonitoring(tanggalStr),
    queryFn: () =>
      apiClient.get<{ data: MonitoringAbsensiResponse }>(
        `/absensi/monitoring?tanggal=${tanggalStr}`,
        undefined,
        "pengguna", // wajib eksplisit -- endpoint /absensi gak ke-detect otomatis di determineTokenKey()
      ),
    refetchInterval: isToday(tanggal) ? 30_000 : false,
  });
}