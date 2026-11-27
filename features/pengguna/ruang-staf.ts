import type { Workspace } from "./api";

/**
 * Ruang kerja seorang pengguna di web (keputusan pemilik proyek RS1a,
 * `modul/jadwal-shift.md`, 27 November 2026), menggantikan saringan
 * `GET /pengguna?workspace=` yang hanya membaca izin dashboard role,
 * sehingga staf akses aplikasi saja (role tanpa izin dashboard) tidak masuk
 * ruang mana pun (`kontrak/temuan.md` butir 197):
 *
 * 1. Lokasi kerja terisi: ruang lokasi itu.
 * 2. Tanpa lokasi kerja: izin dashboard role, dibaca dari daftar ruang
 *    backend (`getByWorkspace`); Owner selalu ada di kedua daftar.
 * 3. Tanpa keduanya: ruang outlet, karena aplikasi kasir dipakai di outlet.
 *
 * Lokasi kerja yang tipenya tidak diketahui (daftar lokasi tidak termuat
 * atau tidak berizin) dilewati ke langkah 2.
 */
export interface DataRuangStaf<P extends { id: string; locationID?: string | null }> {
  semua: readonly P[];
  /** Daftar ruang backend (izin dashboard role). */
  diRuangBackend: Record<Workspace, ReadonlySet<string>>;
  /** Tipe lokasi per id lokasi. */
  tipeLokasi: ReadonlyMap<string, string>;
}

export function ruangPengguna<P extends { id: string; locationID?: string | null }>(
  p: P,
  data: Omit<DataRuangStaf<P>, "semua">,
): Workspace[] {
  const tipe = p.locationID ? data.tipeLokasi.get(p.locationID) : undefined;
  if (tipe === "Outlet") return ["outlet"];
  if (tipe === "Gudang") return ["gudang"];
  const dariIzin = (["outlet", "gudang"] as const).filter((r) => data.diRuangBackend[r].has(p.id));
  return dariIzin.length > 0 ? dariIzin : ["outlet"];
}

/** Pengguna yang masuk satu ruang, urutan daftar backend dipertahankan. */
export function penggunaDiRuang<P extends { id: string; locationID?: string | null }>(
  ruang: Workspace,
  data: DataRuangStaf<P>,
): P[] {
  return data.semua.filter((p) => ruangPengguna(p, data).includes(ruang));
}
