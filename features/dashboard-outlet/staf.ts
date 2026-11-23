/**
 * Status staf di dashboard outlet (keputusan DB3a): monitoring absensi
 * digabung dengan izin dan cuti yang disetujui dan berlaku pada hari itu.
 * Alpha tidak dihitung, karena belum ada aturannya.
 */
import type { MonitoringStaf, StatusAbsensi } from "@/types/absensi";
import type { IzinCuti, TipeIzinCuti } from "@/types/izinCuti";

export type StatusStafDashboard = StatusAbsensi | "sakit" | "izin" | "cuti";

export interface BarisStaf {
  penggunaID: string;
  nama: string;
  status: StatusStafDashboard;
  /** "Terlambat N menit" atau "Luar jadwal" bagi staf yang sudah absen (AB6a); selain itu null. */
  keterangan: string | null;
}

/**
 * Keterangan kedatangan dari sesi terakhir monitoring (backend P62, B278;
 * keputusan AB6a). Tepat Waktu, belum absen, dan sesi tanpa status tidak
 * diberi keterangan.
 */
export function keteranganKedatangan(sesi: MonitoringStaf["sesiTerakhir"]): string | null {
  if (sesi?.statusAbsensi === "Terlambat") {
    const menit = sesi.menitTerlambat ?? 0;
    return menit > 0 ? `Terlambat ${menit} menit` : "Terlambat";
  }
  if (sesi?.statusAbsensi === "Luar Jadwal") return "Luar jadwal";
  return null;
}

const STATUS_DARI_TIPE: Record<TipeIzinCuti, StatusStafDashboard> = {
  sakit: "sakit",
  izin: "izin",
  "cuti tahunan": "cuti",
};

/**
 * Satu baris per staf monitoring. izinCuti sudah disaring server: disetujui
 * dan berlaku pada hari itu (B160, useIzinCutiHari). Kehadiran nyata menang:
 * izin atau cuti hanya menggantikan status belum absen.
 *
 * Sejak backend B348 (P84, butir 187) monitoring per lokasi juga memuat
 * staf tanpa lokasi kerja yang izin atau cuti hari itu, bila perannya
 * memegang izin dashboard ruang itu, sebagai belum absen. Tambahan web dari
 * karyawan ruang menurut peran (31 Oktober 2026, butir 165) dibuang.
 */
export function gabungStatusStaf(daftar: MonitoringStaf[], izinCuti: IzinCuti[]): BarisStaf[] {
  const izinPerStaf = new Map<string, StatusStafDashboard>();
  for (const izin of izinCuti) {
    const id = izin.pengguna?.id;
    const status = STATUS_DARI_TIPE[izin.tipe];
    if (!id || !status || izinPerStaf.has(id)) continue;
    izinPerStaf.set(id, status);
  }
  return daftar.map((staf) => ({
    penggunaID: staf.penggunaID,
    nama: staf.nama,
    status:
      staf.status === "belum_absen"
        ? (izinPerStaf.get(staf.penggunaID) ?? "belum_absen")
        : staf.status,
    keterangan: staf.status === "belum_absen" ? null : keteranganKedatangan(staf.sesiTerakhir),
  }));
}
