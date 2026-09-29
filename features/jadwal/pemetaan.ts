import type { JadwalItem, KaryawanRuang } from "./tipe";
import type { KaryawanJadwal, ShiftItem } from "@/types/jadwal";

/** Warna sel menurut jam masuk, sama dengan halaman lama. */
export function jenisShift(shift: NonNullable<JadwalItem["shift"]>): ShiftItem["type"] {
  const jamMasuk = Number.parseInt(shift.jamMasuk.split(":")[0], 10);
  if (shift.isLintasHari || jamMasuk >= 18 || jamMasuk < 5) return "malam";
  if (jamMasuk >= 14) return "sore";
  return "pagi";
}

/**
 * Item sel satu jadwal. Libur tampil LIBUR (keputusan JD5a), catatan ikut
 * dibawa agar tidak hilang saat diubah (JD4), dan shift nonaktif ditandai
 * (JD7). Jadwal kerja tanpa shift adalah data rusak dan tampil "-"
 * (keputusan rancangan butir 11).
 */
export function itemJadwal(j: JadwalItem): ShiftItem {
  const dasar = { id: j.id, isLibur: j.isLibur, catatan: j.catatan };
  if (j.isLibur) return { ...dasar, type: "off", name: "LIBUR", label: "" };
  if (!j.shift) return { ...dasar, type: "off", name: "-", label: "" };
  return {
    ...dasar,
    masterShiftId: j.shift.id,
    type: jenisShift(j.shift),
    name: j.shift.namaShift,
    label: `${j.shift.jamMasuk} - ${j.shift.jamPulang}`,
    shiftNonaktif: j.shift.status === "Non-Aktif",
  };
}

/** Baris kalender: satu per karyawan ruang, dengan jadwal di hari tanggalKerja-nya. */
export function petakanJadwalKaryawan(karyawan: KaryawanRuang[], jadwal: JadwalItem[]): KaryawanJadwal[] {
  const baris = new Map<string, KaryawanJadwal>(
    karyawan.map((k) => [k.id, { id: k.id, nama: k.nama, role: k.role, jadwalMap: {} }]),
  );
  for (const j of jadwal) {
    const tujuan = baris.get(j.karyawan?.id ?? "");
    if (!tujuan) continue;
    const hari = Number(j.tanggalKerja.slice(8, 10));
    (tujuan.jadwalMap[hari] ??= []).push(itemJadwal(j));
  }
  return [...baris.values()];
}