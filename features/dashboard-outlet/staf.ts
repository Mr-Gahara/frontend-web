/**
 * Status staf di dashboard outlet (keputusan DB3a): monitoring absensi
 * digabung dengan izin dan cuti yang disetujui dan berlaku pada hari itu.
 * Alpha tidak dihitung, karena belum ada aturannya.
 */
import { keTanggalLokal } from "@/lib/waktu";
import type { MonitoringStaf, StatusAbsensi } from "@/types/absensi";
import type { IzinCuti, TipeIzinCuti } from "@/types/izinCuti";

export type StatusStafDashboard = StatusAbsensi | "sakit" | "izin" | "cuti";

export interface BarisStaf {
  penggunaID: string;
  nama: string;
  status: StatusStafDashboard;
}

const STATUS_DARI_TIPE: Record<TipeIzinCuti, StatusStafDashboard> = {
  sakit: "sakit",
  izin: "izin",
  "cuti tahunan": "cuti",
};

/** True bila izin disetujui dan hari itu berada di dalam rentangnya (tanggal lokal). */
export function izinBerlaku(izin: IzinCuti, hari: Date): boolean {
  if (izin.status !== "disetujui") return false;
  const tanggal = keTanggalLokal(hari);
  return (
    keTanggalLokal(new Date(izin.tanggalMulai)) <= tanggal &&
    tanggal <= keTanggalLokal(new Date(izin.tanggalSelesai))
  );
}

/**
 * Satu baris per staf monitoring. Kehadiran nyata menang: izin atau cuti
 * hanya menggantikan status belum absen.
 */
export function gabungStatusStaf(
  daftar: MonitoringStaf[],
  izinCuti: IzinCuti[],
  hari: Date,
): BarisStaf[] {
  const izinPerStaf = new Map<string, StatusStafDashboard>();
  for (const izin of izinCuti) {
    const id = izin.pengguna?.id;
    const status = STATUS_DARI_TIPE[izin.tipe];
    if (!id || !status || izinPerStaf.has(id) || !izinBerlaku(izin, hari)) continue;
    izinPerStaf.set(id, status);
  }
  return daftar.map((staf) => ({
    penggunaID: staf.penggunaID,
    nama: staf.nama,
    status:
      staf.status === "belum_absen"
        ? (izinPerStaf.get(staf.penggunaID) ?? "belum_absen")
        : staf.status,
  }));
}