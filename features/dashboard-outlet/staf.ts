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
}

const STATUS_DARI_TIPE: Record<TipeIzinCuti, StatusStafDashboard> = {
  sakit: "sakit",
  izin: "izin",
  "cuti tahunan": "cuti",
};

/**
 * Satu baris per staf monitoring, ditambah staf ruang yang izin hari itu.
 * izinCuti sudah disaring server: disetujui dan berlaku pada hari itu
 * (B160, useIzinCutiHari). Kehadiran nyata menang: izin atau cuti hanya
 * menggantikan status belum absen.
 *
 * Monitoring per lokasi (B183) hanya memuat staf yang jadwalnya ber-shift
 * di lokasi itu, sedangkan backend menjadikan jadwal staf yang izin
 * disetujui sebagai libur tanpa shift. Karena itu staf yang izin dan
 * termasuk karyawan ruang menurut peran (karyawanRuang, id ke nama)
 * ditambahkan sebagai baris tersendiri (pemilik proyek, 31 Oktober 2026).
 */
export function gabungStatusStaf(
  daftar: MonitoringStaf[],
  izinCuti: IzinCuti[],
  karyawanRuang: ReadonlyMap<string, string>,
): BarisStaf[] {
  const izinPerStaf = new Map<string, StatusStafDashboard>();
  for (const izin of izinCuti) {
    const id = izin.pengguna?.id;
    const status = STATUS_DARI_TIPE[izin.tipe];
    if (!id || !status || izinPerStaf.has(id)) continue;
    izinPerStaf.set(id, status);
  }
  const baris: BarisStaf[] = daftar.map((staf) => ({
    penggunaID: staf.penggunaID,
    nama: staf.nama,
    status:
      staf.status === "belum_absen"
        ? (izinPerStaf.get(staf.penggunaID) ?? "belum_absen")
        : staf.status,
  }));
  const dimuat = new Set(daftar.map((staf) => String(staf.penggunaID)));
  for (const [id, status] of izinPerStaf) {
    const nama = karyawanRuang.get(id);
    if (nama !== undefined && !dimuat.has(id)) baris.push({ penggunaID: id, nama, status });
  }
  return baris;
}
