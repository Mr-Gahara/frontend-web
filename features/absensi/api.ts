/**
 * Pemanggilan API absensi. GET /absensi/monitoring memeriksa read-absensi
 * di route (B141). Dengan locationID (B183) daftar memuat staf yang
 * berjadwal shift di lokasi itu pada tanggal tersebut ditambah yang absen
 * di sana, dan hanya sesi di lokasi itu yang dihitung.
 */
import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/apiClient";
import type { MonitoringAbsensiResponse, RekapAbsensiResponse } from "@/types/absensi";
import type { FormatDaftar } from "@/lib/unduh";

export const absensiApi = {
  monitoring: (tanggal: string, locationID: string) =>
    apiData.get<MonitoringAbsensiResponse>(EP.absensi.monitoring, { tanggal, locationID }),

  /** Rekap per staf satu bulan di lokasi ruang (B358, read-absensi). */
  rekap: (bulan: string, locationID: string) =>
    apiData.get<RekapAbsensiResponse>(EP.absensi.rekap, { bulan, locationID }),

  /** Berkas rekap-absensi_<bulan> CSV atau Excel, ditutup baris TOTAL (B358, P85). */
  unduhRekap: (bulan: string, locationID: string, format: FormatDaftar) =>
    apiClient.unduh(EP.absensi.rekap, { bulan, locationID, format }, `rekap-absensi_${bulan}.${format}`, "pengguna"),
};
