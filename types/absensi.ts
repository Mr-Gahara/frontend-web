// types/absensi.ts
export type StatusAbsensi = "belum_absen" | "sedang_bekerja" | "sudah_pulang";

/** statusAbsensi absen masuk (models/absensiModel.js backend). */
export type StatusKedatangan = "Tepat Waktu" | "Terlambat" | "Luar Jadwal";

export interface MonitoringStaf {
  penggunaID: string;
  nama: string;
  status: StatusAbsensi;
  jumlahSesi: number;
  sesiTerakhir: {
    waktuMasuk: string;
    waktuSelesai: string | null;
    /** Hasil pencocokan absen masuk ke jadwal shift (backend P62, B276, B278). */
    statusAbsensi?: StatusKedatangan | null;
    /** Menit lewat toleransi bila Terlambat; selain itu 0. */
    menitTerlambat?: number;
  } | null;
  totalJamKerja: number;
}

export interface MonitoringAbsensiResponse {
  tanggal: string;
  ringkasan: { totalStaf: number; sudahAbsen: number; belumAbsen: number };
  daftar: MonitoringStaf[];
}