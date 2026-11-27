import type { MonitoringStaf } from "@/types/absensi";
import type { IzinCuti } from "@/types/izinCuti";
import type { PengajuanStok } from "@/types/pengajuanStok";
import type { JadwalItem } from "@/features/jadwal/tipe";
import { keTanggalLokal } from "@/lib/waktu";
import { bolehTautan, type AksesTautan } from "./akses";
import type { Pemberitahuan, TautanPemberitahuan } from "./jenis";

export const URL_STATUS_STAF = "/dashboard/outlet#status-staf";
const URL_DASHBOARD_OUTLET = "/dashboard/outlet";
export const URL_GENERATE_JADWAL = "/dashboard/outlet/jadwal/generate";
const URL_PENGAJUAN_OUTLET = "/dashboard/outlet/inventaris/pengajuanStok";
const POLA_DETAIL_PENGAJUAN = "/dashboard/outlet/inventaris/pengajuanStok/[id]";
const SEHARI_MS = 86_400_000;
const BATAS_NAMA = 3;

function sebut(nama: readonly string[]): string {
  const awal = nama.slice(0, BATAS_NAMA).join(", ");
  return nama.length > BATAS_NAMA ? `${awal}, dan ${nama.length - BATAS_NAMA} lainnya` : awal;
}

/**
 * Perangkat menunggu izin (LN4a, B381, PW08): angka dan sampai tiga nama
 * pengguna pemiliknya, disetujui lewat aplikasi, tanpa tautan (pemilik
 * proyek, 27 November 2026). Satu pengguna dengan beberapa perangkat
 * disebut sekali.
 */
export function pemberitahuanPerangkatMenunggu(
  perangkat: readonly { pengguna: { nama: string } | null }[] | null,
): Pemberitahuan | null {
  if (!perangkat || perangkat.length === 0) return null;
  const nama = [...new Set(perangkat.map((p) => p.pengguna?.nama ?? "staf"))];
  return {
    id: "perangkat-menunggu",
    tingkat: "tindakan",
    judul: "Perangkat menunggu izin",
    isi: `${perangkat.length} perangkat menunggu izin (${sebut(nama)}). Setujui lewat aplikasi.`,
    tautan: [],
  };
}

/** Izin, sakit, atau cuti yang menunggu persetujuan; ditinjau lewat aplikasi, tanpa tautan (LN4a). */
export function pemberitahuanIzinCuti(diajukan: readonly IzinCuti[] | null): Pemberitahuan | null {
  const daftar = (diajukan ?? []).filter((i) => i.status === "diajukan");
  if (daftar.length === 0) return null;
  return {
    id: "izin-cuti",
    tingkat: "tindakan",
    judul: "Izin dan cuti menunggu persetujuan",
    isi: `${daftar.length} pengajuan izin, sakit, atau cuti menunggu persetujuan (${sebut(
      daftar.map((i) => i.pengguna?.nama ?? "staf"),
    )}). Tinjau lewat aplikasi.`,
    tautan: [],
  };
}

/** Awal shift sebuah jadwal hari ini (jamMasuk "HH:MM" pada tanggalKerja lokal). */
function mulaiShift(j: JadwalItem): Date | null {
  if (!j.shift || j.isLibur) return null;
  const [jam, menit] = j.shift.jamMasuk.split(":").map(Number);
  const [t, b, h] = j.tanggalKerja.slice(0, 10).split("-").map(Number);
  if ([jam, menit, t, b, h].some((n) => Number.isNaN(n))) return null;
  return new Date(t, b - 1, h, jam, menit);
}

/**
 * Kehadiran hari ini (LN4a): staf yang belum absen padahal shift jadwalnya
 * hari ini sudah mulai, dan staf yang absen masuk Terlambat. Monitoring juga
 * memuat staf tanpa jadwal (berlokasi kerja, izin), sehingga "belum absen"
 * dicocokkan dengan jadwal shift hari ini di outlet.
 */
export function pemberitahuanKehadiran(
  monitoring: readonly MonitoringStaf[] | null,
  jadwalHariIni: readonly JadwalItem[] | null,
  kini: Date,
  akses: AksesTautan,
): Pemberitahuan | null {
  if (!monitoring || !jadwalHariIni) return null;
  const hariIni = keTanggalLokal(kini);
  const sudahMulai = new Set(
    jadwalHariIni
      .filter((j) => j.tanggalKerja.slice(0, 10) === hariIni && j.karyawan)
      .filter((j) => {
        const mulai = mulaiShift(j);
        return mulai !== null && mulai <= kini;
      })
      .map((j) => j.karyawan!.id),
  );
  const belum = monitoring.filter((s) => s.status === "belum_absen" && sudahMulai.has(s.penggunaID));
  const terlambat = monitoring.filter((s) => s.sesiTerakhir?.statusAbsensi === "Terlambat");
  if (belum.length === 0 && terlambat.length === 0) return null;
  const kalimat: string[] = [];
  if (belum.length) kalimat.push(`${belum.length} staf belum absen padahal shiftnya sudah mulai (${sebut(belum.map((s) => s.nama))}).`);
  if (terlambat.length) kalimat.push(`${terlambat.length} staf absen terlambat (${sebut(terlambat.map((s) => s.nama))}).`);
  return {
    id: "kehadiran",
    tingkat: "tindakan",
    judul: "Kehadiran staf hari ini",
    isi: kalimat.join(" "),
    tautan: bolehTautan(akses, URL_STATUS_STAF, URL_DASHBOARD_OUTLET)
      ? [{ href: URL_STATUS_STAF, label: "Lihat status staf" }]
      : [],
  };
}

/** Senin minggu depan dan Minggu sesudahnya, dalam tanggal lokal YYYY-MM-DD. */
export function rentangMingguDepan(kini: Date): { startDate: string; endDate: string } {
  const hari = kini.getDay(); // 0 Minggu ... 6 Sabtu
  const keSenin = hari === 0 ? 1 : 8 - hari;
  const senin = new Date(kini.getFullYear(), kini.getMonth(), kini.getDate() + keSenin);
  const minggu = new Date(senin.getFullYear(), senin.getMonth(), senin.getDate() + 6);
  return { startDate: keTanggalLokal(senin), endDate: keTanggalLokal(minggu) };
}

/** Pengingat jadwal minggu depan mulai Kamis minggu berjalan sampai Minggu (LN4a). */
export function waktunyaCekJadwal(kini: Date): boolean {
  const hari = kini.getDay();
  return hari === 0 || hari >= 4;
}

/** Jadwal shift minggu depan belum ada sama sekali (LN4a). */
export function pemberitahuanJadwalMingguDepan(
  jadwalMingguDepan: readonly JadwalItem[] | null,
  kini: Date,
  akses: AksesTautan,
): Pemberitahuan | null {
  if (!waktunyaCekJadwal(kini) || !jadwalMingguDepan || jadwalMingguDepan.length > 0) return null;
  const { startDate, endDate } = rentangMingguDepan(kini);
  return {
    id: "jadwal-minggu-depan",
    tingkat: "tindakan",
    judul: "Jadwal minggu depan belum dibuat",
    isi: `Belum ada jadwal shift outlet untuk ${startDate} sampai ${endDate}.`,
    tautan: bolehTautan(akses, URL_GENERATE_JADWAL) ? [{ href: URL_GENERATE_JADWAL, label: "Buat jadwal" }] : [],
  };
}

/** Waktu keputusan pengajuan: tanggalApprove bila disetujui, updatedAt bila ditolak. */
function waktuKeputusan(p: PengajuanStok): Date | null {
  if (p.status === "REJECTED") return new Date(p.updatedAt);
  return p.tanggalApprove ? new Date(p.tanggalApprove) : null;
}

/**
 * Pengajuan stok milik pengguna ini yang disetujui atau ditolak dalam 24 jam
 * terakhir (LN4a, info); berbasis kondisi, sehingga hilang sendiri sesudah
 * 24 jam. Tautan ke detail pengajuan, paling banyak tiga.
 */
export function pemberitahuanHasilPengajuan(
  pengajuan: readonly PengajuanStok[] | null,
  idSaya: string | null,
  kini: Date,
  akses: AksesTautan,
): Pemberitahuan | null {
  if (!pengajuan || !idSaya) return null;
  const baru = pengajuan.filter((p) => {
    if (p.dimintaOleh?.id !== idSaya) return false;
    const waktu = waktuKeputusan(p);
    return waktu !== null && kini.getTime() - waktu.getTime() <= SEHARI_MS && waktu <= kini;
  });
  if (baru.length === 0) return null;
  const disetujui = baru.filter((p) => p.status !== "REJECTED");
  const ditolak = baru.filter((p) => p.status === "REJECTED");
  const kalimat: string[] = [];
  if (disetujui.length) kalimat.push(`${disetujui.length} disetujui (${sebut(disetujui.map((p) => p.nomorPengajuan))})`);
  if (ditolak.length) kalimat.push(`${ditolak.length} ditolak (${sebut(ditolak.map((p) => p.nomorPengajuan))})`);
  const tautan: TautanPemberitahuan[] = [];
  for (const p of baru.slice(0, 3)) {
    const href = `${URL_PENGAJUAN_OUTLET}/${p.id}`;
    if (bolehTautan(akses, href, POLA_DETAIL_PENGAJUAN)) tautan.push({ href, label: p.nomorPengajuan });
  }
  return {
    id: "hasil-pengajuan",
    tingkat: "info",
    judul: "Pengajuan stok Anda sudah diputuskan",
    isi: `Dalam 24 jam terakhir: ${kalimat.join(", ")}.`,
    tautan,
  };
}
