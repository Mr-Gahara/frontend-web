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
 * Sejak backend 916e7df (B278, butir 165) monitoring juga memuat staf yang
 * lokasi kerjanya lokasi itu, termasuk yang izin, sebagai belum absen;
 * tambahan ini tetap dibutuhkan bagi staf tanpa lokasi kerja, dan staf
 * yang sudah termuat tidak ditambahkan dua kali.
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
    keterangan: staf.status === "belum_absen" ? null : keteranganKedatangan(staf.sesiTerakhir),
  }));
  const dimuat = new Set(daftar.map((staf) => String(staf.penggunaID)));
  for (const [id, status] of izinPerStaf) {
    const nama = karyawanRuang.get(id);
    if (nama !== undefined && !dimuat.has(id)) baris.push({ penggunaID: id, nama, status, keterangan: null });
  }
  return baris;
}
