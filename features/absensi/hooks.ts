"use client";

/**
 * Monitoring absensi harian satu ruang, disaring server lewat lokasi ruang
 * (B183, pemilik proyek 31 Oktober 2026: per lokasi, menggantikan AB4a).
 * Untuk hari ini data dimuat ulang setiap 30 detik, sama dengan masa cache
 * backend. Jawaban 403 tidak diulang, agar pesan izin langsung tampil
 * (keputusan AB3a). Lokasi yang gagal dimuat dilaporkan sebagai galat.
 * aktif false menahan lokasi dan monitoring, misalnya tanpa read-location.
 */
import { useQuery } from "@tanstack/react-query";
import { absensiApi } from "./api";
import { useLokasiRuang } from "@/features/inventaris/hooks";
import { isForbidden } from "@/lib/api/error";
import { queryKeys } from "@/lib/queryKeys";
import { keTanggalLokal } from "@/lib/waktu";

export function useMonitoringAbsensi(
  tanggal: Date,
  ruang: "outlet" | "gudang",
  { aktif = true }: { aktif?: boolean } = {},
) {
  const lokasi = useLokasiRuang(ruang, { aktif });
  const tanggalStr = keTanggalLokal(tanggal);
  const hariIni = tanggalStr === keTanggalLokal(new Date());
  const kueri = useQuery({
    queryKey: queryKeys.absensi.monitoring(tanggalStr, lokasi.lokasiId ?? ""),
    queryFn: () => absensiApi.monitoring(tanggalStr, lokasi.lokasiId!),
    enabled: aktif && lokasi.lokasiId !== null,
    refetchInterval: hariIni ? 30_000 : false,
    retry: (percobaan, galat) => !isForbidden(galat) && percobaan < 3,
  });
  return {
    data: kueri.data,
    isLoading: lokasi.memuat || kueri.isLoading,
    isError: lokasi.gagal || kueri.isError,
    error: kueri.error,
  };
}
