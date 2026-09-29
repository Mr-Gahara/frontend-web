/** Ringkasan shift satu hari pola hasil populate (mappers/polaRosterMapper.js). */
export interface ShiftPolaRoster {
  id: string;
  namaShift?: string;
  jamMasuk?: string;
  jamPulang?: string;
  status?: "Aktif" | "Non-Aktif";
}

export interface DetailSiklusItem {
  hariKe: number;
  isLibur: boolean;
  shiftID?: string | null; // null untuk hari libur
  shift?: ShiftPolaRoster | null;
}

/**
 * Pola roster dari GET /polaroster, sesuai mappers/polaRosterMapper.js
 * backend 00b9957. Backend tidak punya field status (keputusan Fase 0).
 * keterangan dan dibuatPada opsional hanya agar pemetaan halaman generate
 * lama tetap berlaku; dijadikan wajib saat generate dimigrasikan
 * (submodul 4).
 */
export interface PolaRosterItem {
  id: string;
  namaPola: string;
  siklusHari: number;
  detailSiklus: DetailSiklusItem[];
  keterangan?: string | null;
  dibuatPada?: string | null;
}

/** Payload POST dan PUT /polaroster: shiftID hanya untuk hari kerja. */
export interface PolaRosterRequest {
  namaPola: string;
  siklusHari: number;
  detailSiklus: { hariKe: number; isLibur: boolean; shiftID?: string }[];
}
