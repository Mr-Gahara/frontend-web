import { KUNCI_LOKASI_SHIFT } from "./ruang";
import { POLA_JAM, type NilaiFormShift } from "./schema";
import type { ShiftItem, ShiftRequest } from "@/types/shift";

const keMenit = (jam: string) => {
  const [h, m] = jam.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Lintas hari bila jam pulang tidak lebih besar dari jam masuk, termasuk
 * jam yang sama (shift 24 jam), sama dengan aturan form lama. Jam yang
 * belum lengkap dianggap bukan lintas hari (keputusan SH2a).
 */
export function hitungLintasHari(jamMasuk: string, jamPulang: string): boolean {
  if (!POLA_JAM.test(jamMasuk) || !POLA_JAM.test(jamPulang)) return false;
  return keMenit(jamPulang) <= keMenit(jamMasuk);
}

/** Nilai awal form: kosong untuk buat, dari data shift untuk ubah. Toleransi 0 tampil kosong, seperti form lama. */
export function nilaiAwalShift(shift: ShiftItem | null): NilaiFormShift {
  if (!shift) {
    return { namaShift: "", jamMasuk: "", jamPulang: "", toleransi: "", status: "Aktif" };
  }
  return {
    namaShift: shift.namaShift,
    jamMasuk: shift.jamMasuk,
    jamPulang: shift.jamPulang,
    toleransi: shift.toleransiTerlambat === 0 ? "" : String(shift.toleransiTerlambat),
    status: shift.status,
  };
}

/**
 * Payload POST dan PUT /shift. Nama dipangkas, toleransi kosong menjadi 0,
 * dan lintas hari dihitung dari jam. Field workspace dari halaman lama
 * tidak dikirim lagi, karena backend tidak membacanya. Lokasi ruang hanya
 * dikirim begitu backend memisahkan shift per lokasi (ruang.ts, keputusan
 * SH1b).
 */
export function payloadShift(nilai: NilaiFormShift, lokasiId: string | null): ShiftRequest {
  const payload: ShiftRequest = {
    namaShift: nilai.namaShift.trim(),
    jamMasuk: nilai.jamMasuk,
    jamPulang: nilai.jamPulang,
    isLintasHari: hitungLintasHari(nilai.jamMasuk, nilai.jamPulang),
    toleransiTerlambat: nilai.toleransi.trim() === "" ? 0 : Number(nilai.toleransi),
    status: nilai.status,
  };
  if (KUNCI_LOKASI_SHIFT !== null && lokasiId !== null) {
    return { ...payload, [KUNCI_LOKASI_SHIFT]: lokasiId };
  }
  return payload;
}