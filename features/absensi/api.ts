/**
 * Pemanggilan API absensi. GET /absensi/monitoring memeriksa izin
 * read-absensi di controller (403 bila tidak ada) dan memuat seluruh staf
 * aktif satu tenant; backend belum memisahkannya per lokasi (keputusan
 * SH5a, kontrak/temuan.md butir 70).
 */
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { MonitoringAbsensiResponse } from "@/types/absensi";

export const absensiApi = {
  monitoring: (tanggal: string) =>
    apiData.get<MonitoringAbsensiResponse>(EP.absensi.monitoring, { tanggal }),
};