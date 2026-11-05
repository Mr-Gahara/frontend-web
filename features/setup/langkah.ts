import type { KunciPlan } from "@/types/langganan";

/**
 * Daftar langkah wizard setup per plan (modul/setup-akun.md, Kriteria setup
 * dan PL1a sampai PL6a). Basic memuat setup inti; Advanced menambah sesi
 * booking; Pro menambah sesi booking lalu gudang. Plan dibaca dari status
 * setup (features/setup/status.ts).
 */
export type KunciLangkah =
  | "toko"
  | "owner"
  | "lokasi"
  | "kategori"
  | "bahanBaku"
  | "produk"
  | "pajak"
  | "booking"
  | "gudang";

export interface LangkahSetup {
  kunci: KunciLangkah;
  judul: string;
}

const LANGKAH_INTI: readonly LangkahSetup[] = [
  { kunci: "toko", judul: "Nama toko" },
  { kunci: "owner", judul: "Owner" },
  { kunci: "lokasi", judul: "Lokasi outlet" },
  { kunci: "kategori", judul: "Kategori" },
  { kunci: "bahanBaku", judul: "Bahan baku, bila ada resep" },
  { kunci: "produk", judul: "Produk" },
  { kunci: "pajak", judul: "Pajak" },
];

const LANGKAH_BOOKING: LangkahSetup = { kunci: "booking", judul: "Sesi booking" };
const LANGKAH_GUDANG: LangkahSetup = { kunci: "gudang", judul: "Gudang" };

export function daftarLangkah(plan: KunciPlan): readonly LangkahSetup[] {
  if (plan === "pro") return [...LANGKAH_INTI, LANGKAH_BOOKING, LANGKAH_GUDANG];
  if (plan === "advanced") return [...LANGKAH_INTI, LANGKAH_BOOKING];
  return LANGKAH_INTI;
}

/** Properti bersama setiap komponen langkah. */
export interface PropsLangkah<T> {
  nomor: number;
  total: number;
  teksLanjut: string;
  awal: T;
  /** Boleh mengembalikan Promise penyimpanan; penolakannya tampil di langkah (useKirim). */
  onLanjut: (nilai: T) => unknown;
  onKembali?: () => void;
  /** Hanya untuk setup fitur yang boleh dilengkapi nanti (sesi booking dan gudang). */
  onLewati?: () => void;
}
/** Butir daftar tersimpan di server (kategori, bahan baku, produk). */
export interface ButirDaftar {
  id: string;
  label: string;
  keterangan?: string;
}

/**
 * Langkah berisi daftar: setiap butir langsung disimpan dan dihapus di
 * server (keputusan pemilik proyek, 5 November 2026), dan daftar yang
 * tampil selalu dari server.
 */
export interface PropsDaftar<N> {
  nomor: number;
  total: number;
  teksLanjut: string;
  butir: ButirDaftar[];
  onTambah: (nilai: N) => unknown;
  onHapus: (id: string) => unknown;
  onLanjut: () => void;
  onKembali?: () => void;
}
