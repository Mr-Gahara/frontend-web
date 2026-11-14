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
 * backend (ridho lokal d6709a1): keterangan dan dibuatPada selalu dikirim,
 * berisi null bila kosong. Backend tidak punya field status (keputusan
 * Fase 0).
 */
export interface PolaRosterItem {
  id: string;
  namaPola: string;
  siklusHari: number;
  detailSiklus: DetailSiklusItem[];
  keterangan: string | null;
  dibuatPada: string | null;
}

/** Payload POST dan PUT /polaroster: shiftID hanya untuk hari kerja. */
export interface PolaRosterRequest {
  namaPola: string;
  siklusHari: number;
  detailSiklus: { hariKe: number; isLibur: boolean; shiftID?: string }[];
  /** Lokasi ruang, wajib saat buat sejak B168. */
  locationID?: string;
}
