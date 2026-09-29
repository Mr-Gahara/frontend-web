import type { EntriBulkJadwal, KaryawanRuang } from "./tipe";
import type { PolaRosterItem } from "@/types/pola-roster";
import type { ShiftItem } from "@/types/shift";

export type MasalahShift = "nonaktif" | "hilang";

export interface SelSimulasi {
  tanggal: string;
  isLibur: boolean;
  shiftID?: string;
  label: string;
  jam: string;
  namaShift?: string;
  masalah: MasalahShift | null;
}

export interface BarisSimulasi {
  karyawan: KaryawanRuang;
  jadwal: SelSimulasi[];
}

/**
 * Simulasi generate, dipindah dari step-dua-preview lama: hari ke-n rentang
 * memakai hari ke-(n mod siklus)+1 pola, dan label shift adalah empat huruf
 * pertama namanya. Bedanya dengan kode lama (keputusan GN2a): hari yang
 * shift-nya nonaktif atau tidak ditemukan ditandai, bukan diam-diam menjadi
 * libur, karena backend melewatinya tanpa mencatatnya (temuan butir 62).
 */
export function simulasiGenerate(
  tanggal: string[],
  pola: PolaRosterItem | undefined,
  shiftList: ShiftItem[],
  karyawan: KaryawanRuang[],
): BarisSimulasi[] {
  const siklus = pola?.siklusHari || 7;
  const jadwal = tanggal.map((tgl, index): SelSimulasi => {
    const detail = pola?.detailSiklus.find((d) => d.hariKe === (index % siklus) + 1);
    if (!detail || detail.isLibur || !detail.shiftID) {
      return { tanggal: tgl, isLibur: true, label: "OFF", jam: "", masalah: null };
    }
    const shift = shiftList.find((s) => s.id === detail.shiftID);
    if (!shift) {
      return { tanggal: tgl, isLibur: false, label: "?", jam: "", namaShift: detail.shift?.namaShift, masalah: "hilang" };
    }
    const dasar = {
      tanggal: tgl,
      isLibur: false,
      label: shift.namaShift.substring(0, 4).toUpperCase(),
      jam: `${shift.jamMasuk} - ${shift.jamPulang}`,
      namaShift: shift.namaShift,
    };
    if (shift.status !== "Aktif") return { ...dasar, masalah: "nonaktif" };
    return { ...dasar, shiftID: shift.id, masalah: null };
  });
  return karyawan.map((k) => ({ karyawan: k, jadwal }));
}

/** Pesan yang menahan simpan bila ada hari dengan shift bermasalah (GN2a), atau null. */
export function pesanMasalahSimulasi(baris: BarisSimulasi[]): string | null {
  const sel = baris[0]?.jadwal.find((j) => j.masalah !== null);
  if (!sel) return null;
  const nama = sel.namaShift ? `"${sel.namaShift}"` : "yang dipakai";
  const sebab = sel.masalah === "nonaktif" ? "sudah nonaktif" : "tidak ditemukan";
  return `Shift ${nama} pada pola ini ${sebab}. Perbaiki pola roster sebelum menyimpan jadwal.`;
}

/** Payload POST /jadwalshift/bulk: satu entri per karyawan per tanggal, seperti kode lama. */
export function entriBulkJadwal(baris: BarisSimulasi[]): EntriBulkJadwal[] {
  return baris.flatMap((b) =>
    b.jadwal.map((j) => ({
      penggunaID: b.karyawan.id,
      tanggalKerja: j.tanggal,
      isLibur: j.isLibur,
      shiftID: j.shiftID,
    })),
  );
}