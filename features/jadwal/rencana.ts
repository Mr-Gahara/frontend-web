import type { PayloadJadwalManual, PayloadUbahJadwal } from "./tipe";
import type { ShiftItem } from "@/types/jadwal";

export type LangkahJadwal =
  | { jenis: "ubah"; id: string; payload: PayloadUbahJadwal }
  | { jenis: "hapus"; id: string }
  | { jenis: "buat"; payload: PayloadJadwalManual };

/**
 * Langkah menyimpan jadwal satu karyawan di satu hari, sama urutannya dengan
 * form lama. Tanpa jadwal: satu POST. Menjadi libur: jadwal pertama diubah
 * menjadi libur dan sisanya dihapus. Kerja: jadwal lama diubah berurutan
 * sesuai shift terpilih, yang berlebih dihapus, dan shift tambahan dibuat
 * dalam satu POST. Dijalankan berurutan dengan satu ringkasan (JD6a).
 */
export function rencanaSimpanJadwal(ada: ShiftItem[], nilai: PayloadJadwalManual): LangkahJadwal[] {
  const lama = ada.filter((s) => s.id !== "off");
  if (lama.length === 0) return [{ jenis: "buat", payload: nilai }];
  const hapus = (s: ShiftItem): LangkahJadwal => ({ jenis: "hapus", id: s.id });
  if (nilai.isLibur) {
    return [
      { jenis: "ubah", id: lama[0].id, payload: { isLibur: true, shiftID: null, catatan: nilai.catatan } },
      ...lama.slice(1).map(hapus),
    ];
  }
  const langkah: LangkahJadwal[] = lama.map((s, i) =>
    i < nilai.shiftIds.length
      ? { jenis: "ubah", id: s.id, payload: { isLibur: false, shiftID: nilai.shiftIds[i], catatan: nilai.catatan } }
      : hapus(s),
  );
  if (nilai.shiftIds.length > lama.length) {
    langkah.push({ jenis: "buat", payload: { ...nilai, shiftIds: nilai.shiftIds.slice(lama.length) } });
  }
  return langkah;
}