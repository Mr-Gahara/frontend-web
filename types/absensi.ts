// types/absensi.ts
export type StatusAbsensi = "belum_absen" | "sedang_bekerja" | "sudah_pulang";

export interface MonitoringStaf {
  penggunaID: string;
  nama: string;
  status: StatusAbsensi;
  jumlahSesi: number;
  sesiTerakhir: { waktuMasuk: string; waktuSelesai: string | null } | null;
  totalJamKerja: number;
}

export interface MonitoringAbsensiResponse {
  tanggal: string;
  ringkasan: { totalStaf: number; sudahAbsen: number; belumAbsen: number };
  daftar: MonitoringStaf[];
}