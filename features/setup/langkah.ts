/**
 * Daftar langkah wizard setup per plan (modul/setup-akun.md, Kriteria setup
 * dan PL1a sampai PL6a). Basic memuat setup inti; Advanced menambah sesi
 * booking; Pro menambah sesi booking lalu gudang. Selama status setup dari
 * backend (Y1) belum ada, plan untuk pratinjau dibaca dari ?plan=.
 */
export const PLAN_SETUP = ["basic", "advanced", "pro"] as const;
export type PlanSetup = (typeof PLAN_SETUP)[number];

export const NAMA_PLAN: Record<PlanSetup, string> = {
  basic: "Basic",
  advanced: "Advanced",
  pro: "Pro",
};

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

export function daftarLangkah(plan: PlanSetup): readonly LangkahSetup[] {
  if (plan === "pro") return [...LANGKAH_INTI, LANGKAH_BOOKING, LANGKAH_GUDANG];
  if (plan === "advanced") return [...LANGKAH_INTI, LANGKAH_BOOKING];
  return LANGKAH_INTI;
}

/** Nilai plan yang tidak dikenal, kosong, atau tidak ada dianggap Basic. */
export function bacaPlan(nilai: string | null | undefined): PlanSetup {
  return (PLAN_SETUP as readonly string[]).includes(nilai ?? "") ? (nilai as PlanSetup) : "basic";
}

/** Properti bersama setiap komponen langkah. */
export interface PropsLangkah<T> {
  nomor: number;
  total: number;
  teksLanjut: string;
  awal: T;
  onLanjut: (nilai: T) => void;
  onKembali?: () => void;
}