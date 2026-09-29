import { KUNCI_LOKASI_POLA_ROSTER } from "./ruang";
import { BATAS_SIKLUS, type NilaiFormPolaRoster } from "./schema";
import type { DetailSiklusItem, PolaRosterItem, PolaRosterRequest } from "@/types/pola-roster";
import type { ShiftItem } from "@/types/shift";

type BarisSiklus = NilaiFormPolaRoster["detailSiklus"][number];

const barisLibur = (hariKe: number): BarisSiklus => ({ hariKe, isLibur: true, shiftID: "" });

/** Nilai awal form: 7 hari libur untuk buat (seperti form lama), atau data pola untuk ubah. */
export function nilaiAwalPolaRoster(pola: PolaRosterItem | null): NilaiFormPolaRoster {
  if (!pola) {
    return {
      namaPola: "",
      siklus: "7",
      detailSiklus: Array.from({ length: 7 }, (_, i) => barisLibur(i + 1)),
    };
  }
  return {
    namaPola: pola.namaPola,
    siklus: String(pola.siklusHari),
    detailSiklus: pola.detailSiklus.map((d) => ({
      hariKe: d.hariKe,
      isLibur: d.isLibur,
      shiftID: d.isLibur ? "" : (d.shiftID ?? d.shift?.id ?? ""),
    })),
  };
}

/**
 * Ketikan siklus (keputusan PL3a): selain angka dibuang, dan ketikan yang
 * membuat siklus melebihi batas ditolak, sehingga isian tetap berisi nilai
 * sah terakhir. Isian kosong diterima.
 */
export function terimaKetikanSiklus(sebelum: string, masukan: string): string {
  const angka = masukan.replace(/\D/g, "");
  if (angka !== "" && Number(angka) > BATAS_SIKLUS) return sebelum;
  return angka;
}

/**
 * Rincian untuk jumlah hari baru: baris yang ada dipertahankan beserta
 * pilihan shift-nya, dan baris baru berstatus libur.
 */
export function sesuaikanRincian(rincian: BarisSiklus[], jumlah: number): BarisSiklus[] {
  if (jumlah === rincian.length) return rincian;
  if (jumlah < rincian.length) return rincian.slice(0, jumlah);
  const tambahan = Array.from({ length: jumlah - rincian.length }, (_, i) =>
    barisLibur(rincian.length + i + 1),
  );
  return [...rincian, ...tambahan];
}

/** Payload POST dan PUT /polaroster: nama dipangkas, dan shiftID hanya untuk hari kerja. */
export function payloadPolaRoster(nilai: NilaiFormPolaRoster): PolaRosterRequest {
  return {
    namaPola: nilai.namaPola.trim(),
    siklusHari: Number(nilai.siklus),
    detailSiklus: nilai.detailSiklus.map((d) =>
      d.isLibur
        ? { hariKe: d.hariKe, isLibur: true }
        : { hariKe: d.hariKe, isLibur: false, shiftID: d.shiftID },
    ),
  };
}

/** Menambah lokasi ruang ke payload begitu backend memisahkan pola roster per lokasi (PL5). */
export function tambahLokasiPolaRoster(
  payload: PolaRosterRequest,
  lokasiId: string | null,
): PolaRosterRequest {
  if (KUNCI_LOKASI_POLA_ROSTER !== null && lokasiId !== null) {
    return { ...payload, [KUNCI_LOKASI_POLA_ROSTER]: lokasiId };
  }
  return payload;
}

export type LabelShiftPola = { nama: string; nonaktif: boolean };

/**
 * Label shift satu hari pola (keputusan PL1a): nama dan status dari daftar
 * shift, atau dari shift hasil populate di respons pola bila tidak ada di
 * daftar. "Tidak Diketahui" hanya bila keduanya tidak menyebut namanya.
 */
export function labelShiftPola(
  detail: Pick<DetailSiklusItem, "shiftID" | "shift">,
  daftarShift: ShiftItem[],
): LabelShiftPola {
  const id = detail.shiftID ?? detail.shift?.id ?? "";
  const shift = daftarShift.find((s) => s.id === id);
  const nama = shift?.namaShift ?? detail.shift?.namaShift;
  if (!nama) return { nama: "Tidak Diketahui", nonaktif: false };
  return { nama, nonaktif: (shift?.status ?? detail.shift?.status) === "Non-Aktif" };
}

export const teksLabelShift = (label: LabelShiftPola) =>
  label.nonaktif ? `${label.nama} (nonaktif)` : label.nama;