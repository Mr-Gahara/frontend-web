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
  /**
   * Kartu kesiapan toko (PW19, KS2a): paling atas di atas tingkat mana pun
   * dan selalu tampil di panel ringkas, tetapi warnanya tetap menurut tingkat.
   */
  utama?: boolean;
  /** Tombol aksi di kartu selain tautan; ditangani pemasang kartu (KS10a: "Toko ini hanya saya"). */
  tombol?: { aksi: "hanya-owner"; label: string };
}

const URUTAN: Record<TingkatPemberitahuan, number> = { penting: 0, tindakan: 1, info: 2 };

/** Urut per tingkat, kartu utama lebih dulu; di dalam tingkat urutan sumber dipertahankan. */
export function urutkanPemberitahuan(daftar: readonly Pemberitahuan[]): Pemberitahuan[] {
  const utama = (p: Pemberitahuan) => (p.utama ? 0 : 1);
  return daftar
    .map((p, i) => ({ p, i }))
    .sort((a, b) => utama(a.p) - utama(b.p) || URUTAN[a.p.tingkat] - URUTAN[b.p.tingkat] || a.i - b.i)
    .map(({ p }) => p);
}

/** Tingkat tertinggi untuk warna lencana; null bila tidak ada pemberitahuan. */
export function tingkatTertinggi(daftar: readonly Pemberitahuan[]): TingkatPemberitahuan | null {
  if (daftar.length === 0) return null;
  return daftar.reduce((a, p) => (URUTAN[p.tingkat] < URUTAN[a] ? p.tingkat : a), daftar[0].tingkat);
}

/** Angka lencana lonceng: 9+ bila lebih dari sembilan (LN12a). */
export function teksLencana(jumlah: number): string {
  return jumlah > 9 ? "9+" : String(jumlah);
}

/** Kartu paling banyak di panel lonceng, kecuali kartu penting (LN19a). */
export const BATAS_PANEL = 5;

/**
 * Isi panel lonceng (LN19a): kartu utama (kesiapan toko, KS2a) dan seluruh
 * kartu penting selalu tampil, lalu kartu berikutnya menurut urutan tingkat
 * sampai total BATAS_PANEL; sisanya dibentangkan di panel yang sama lewat
 * Lihat semua.
 */
export function ringkasPanel(
  daftar: readonly Pemberitahuan[],
  batas = BATAS_PANEL,
): { tampil: Pemberitahuan[]; tersembunyi: number } {
  const urut = urutkanPemberitahuan(daftar);
  // Kartu utama di depan, lalu kartu penting: keduanya berurutan di awal daftar.
  const wajib = urut.filter((p) => p.utama || p.tingkat === "penting").length;
  const tampil = urut.slice(0, Math.max(wajib, batas));
  return { tampil, tersembunyi: urut.length - tampil.length };
}

/** Nama tingkat untuk pembaca layar di kartu. */
export const NAMA_TINGKAT: Record<TingkatPemberitahuan, string> = {
  penting: "Penting",
  tindakan: "Perlu tindakan",
  info: "Info",
};

/** Nama aksesibel tombol lonceng. */
export function namaLonceng(jumlah: number): string {
  return jumlah > 0 ? `Pemberitahuan, ${jumlah} baru` : "Pemberitahuan";
}
