import type { MonitoringStaf } from "@/types/absensi";

/**
 * Staf monitoring yang termasuk karyawan ruang itu (keputusan AB4a).
 * Backend memuat seluruh staf tenant; staf yang terdaftar di kedua ruang
 * tampil di keduanya.
 */
export function stafRuang(daftar: MonitoringStaf[], idKaryawan: ReadonlySet<string>): MonitoringStaf[] {
  return daftar.filter((s) => idKaryawan.has(String(s.penggunaID)));
}

/** Staf yang sedang bekerja, dan jumlah yang sudah absen hari ini (keputusan AB5a). */
export function hitungAbsensi(daftar: MonitoringStaf[]) {
  return {
    sedangBekerja: daftar.filter((s) => s.status === "sedang_bekerja"),
    sudahAbsen: daftar.filter((s) => s.status !== "belum_absen").length,
  };
}

const FORMAT_JAM_WIB = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Jakarta",
});

/** Jam dalam WIB, apa pun zona waktu browsernya (AB7); "-" bila kosong atau tidak sah. */
export function jamWIB(waktu: string | null | undefined): string {
  if (!waktu) return "-";
  const tanggal = new Date(waktu);
  if (Number.isNaN(tanggal.getTime())) return "-";
  return `${FORMAT_JAM_WIB.format(tanggal)} WIB`;
}