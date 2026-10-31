/**
 * Pemanggilan API absensi. GET /absensi/monitoring memeriksa read-absensi
 * di route (B141). Dengan locationID (B183) daftar memuat staf yang
 * berjadwal shift di lokasi itu pada tanggal tersebut ditambah yang absen
 * di sana, dan hanya sesi di lokasi itu yang dihitung.
 */
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { MonitoringAbsensiResponse } from "@/types/absensi";

export const absensiApi = {
  monitoring: (tanggal: string, locationID: string) =>
    apiData.get<MonitoringAbsensiResponse>(EP.absensi.monitoring, { tanggal, locationID }),
};
