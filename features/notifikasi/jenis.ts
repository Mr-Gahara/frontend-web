/**
 * Bentuk satu pemberitahuan lonceng (modul/pemberitahuan.md). Setiap sumber
 * adalah fungsi murni yang mengubah data endpoint menjadi pemberitahuan;
 * berbasis kondisi tanpa status dibaca (LN5a), sehingga pemberitahuan hilang
 * sendiri begitu kondisinya beres.
 */

/** Tiga tingkat LN11a: penting (rose), perlu tindakan (karamel), info (navy). */
export type TingkatPemberitahuan = "penting" | "tindakan" | "info";

export interface TautanPemberitahuan {
  href: string;
  label: string;
}

export interface Pemberitahuan {
  /** Stabil per sumber, untuk key dan pencarian di spec. */
  id: string;
  tingkat: TingkatPemberitahuan;
  judul: string;
  isi: string;
  /** Sudah disaring izin, plan, dan setup fitur; kosong bila tidak ada yang boleh dibuka. */
  tautan: TautanPemberitahuan[];
  /** Bilah 0 sampai 100 (kartu langganan, LN12a); null bila tidak ada bilah. */
  persen?: number | null;
}

const URUTAN: Record<TingkatPemberitahuan, number> = { penting: 0, tindakan: 1, info: 2 };

/** Urut per tingkat; di dalam tingkat urutan sumber dipertahankan. */
export function urutkanPemberitahuan(daftar: readonly Pemberitahuan[]): Pemberitahuan[] {
  return daftar
    .map((p, i) => ({ p, i }))
    .sort((a, b) => URUTAN[a.p.tingkat] - URUTAN[b.p.tingkat] || a.i - b.i)
    .map(({ p }) => p);
}

/** Tingkat tertinggi untuk warna lencana; null bila tidak ada pemberitahuan. */
export function tingkatTertinggi(daftar: readonly Pemberitahuan[]): TingkatPemberitahuan | null {
  return urutkanPemberitahuan(daftar)[0]?.tingkat ?? null;
}

/** Angka lencana lonceng: 9+ bila lebih dari sembilan (LN12a). */
export function teksLencana(jumlah: number): string {
  return jumlah > 9 ? "9+" : String(jumlah);
}

/** Nama aksesibel tombol lonceng. */
export function namaLonceng(jumlah: number): string {
  return jumlah > 0 ? `Pemberitahuan, ${jumlah} baru` : "Pemberitahuan";
}
