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
/**
 * Satu staf di GET /absensi/rekap?bulan= (backend B358, AR40, P85, P86).
 * shiftTidakHadir dihitung per shift: jadwal kerja sebelum hari ini tanpa
 * absen tertaut dan tanpa izin cuti disetujui (P86), bukan status alpha
 * harian (DB3a).
 */
export interface RekapAbsensiStaf {
  penggunaID: string;
  nama: string;
  shiftDijadwalkan: number;
  hariHadir: number;
  sesiHadir: number;
  tepatWaktu: number;
  terlambat: number;
  menitTerlambat: number;
  luarJadwal: number;
  menitPulangAwal: number;
  jamKerja: number;
  hariSakit: number;
  hariIzin: number;
  hariCuti: number;
  shiftTidakHadir: number;
}

/** ringkasan memuat totalStaf dan jumlah setiap field angka staf. */
export type RingkasanRekapAbsensi = { totalStaf: number } & Partial<Omit<RekapAbsensiStaf, "penggunaID" | "nama">>;

export interface RekapAbsensiResponse {
  bulan: string;
  locationID: string | null;
  ringkasan: RingkasanRekapAbsensi;
  data: RekapAbsensiStaf[];
}
