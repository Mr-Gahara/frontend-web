/** Menghitung: simpan hitungan dan ajukan (route PATCH items dan submit). */
export const IZIN_HITUNG_OPNAME = "submit-stock-opname";
/** Meninjau: setujui, tolak, dan batalkan (route PATCH approve, reject, dan cancel). */
export const IZIN_TINJAU_OPNAME = "review-stock-opname";

export function bolehHitungOpname(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN_HITUNG_OPNAME);
}

export function bolehTinjauOpname(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN_TINJAU_OPNAME);
}