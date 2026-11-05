import type { KunciPlan } from "@/types/langganan";

/**
 * Fitur per plan, sama dengan FITUR_PER_PLAN backend (config/constants.js,
 * N2 dan Y5). Sesi booking mencakup sesi booking, aset, tipe aset, dan
 * tarif; WMS mencakup gudang dan seluruh alurnya. Fitur lain ada di semua
 * plan.
 */
export type FiturPlan = "sesi-booking" | "wms";

const FITUR_PER_PLAN: Record<KunciPlan, readonly FiturPlan[]> = {
  basic: [],
  advanced: ["sesi-booking"],
  pro: ["sesi-booking", "wms"],
};

export const NAMA_FITUR: Record<FiturPlan, string> = { "sesi-booking": "Sesi Booking", wms: "Gudang" };

/** Plan termurah yang mencakup sebuah fitur, untuk teks ajakan naik plan. */
export const PLAN_MINIMAL: Record<FiturPlan, KunciPlan> = { "sesi-booking": "advanced", wms: "pro" };

const PLAN_DIKENAL = Object.keys(FITUR_PER_PLAN) as KunciPlan[];

/** Plan dari payload token; nilai kosong atau tidak dikenal dibaca Basic, seperti planAkun backend. */
export function bacaPlanToken(nilai: unknown): KunciPlan {
  return PLAN_DIKENAL.includes(nilai as KunciPlan) ? (nilai as KunciPlan) : "basic";
}

export function planMencakup(plan: KunciPlan, fitur: FiturPlan): boolean {
  return FITUR_PER_PLAN[plan].includes(fitur);
}

/**
 * Awalan rute yang seluruhnya milik sebuah fitur (keputusan pemilik proyek,
 * 5 November 2026: di luar plan disembunyikan, dan URL langsung menampilkan
 * ajakan naik plan). Pembelian Stok outlet ada di semua plan.
 */
const RUTE_FITUR: readonly [string, FiturPlan][] = [
  ["/dashboard/outlet/reservasi", "sesi-booking"],
  ["/dashboard/gudang", "wms"],
  ["/dashboard/outlet/inventaris/pengajuanStok", "wms"],
  ["/dashboard/outlet/inventaris/penerimaanBarang", "wms"],
  ["/dashboard/outlet/inventaris/pengirimanBarang", "wms"],
];

/** Fitur pemilik sebuah rute atau href menu; null bila ada di semua plan. */
export function fiturRute(pathname: string): FiturPlan | null {
  const cocok = RUTE_FITUR.find(([awalan]) => pathname === awalan || pathname.startsWith(awalan + "/"));
  return cocok ? cocok[1] : null;
}

/** Rute atau menu boleh dibuka menurut plan. */
export function bolehMenurutPlan(pathname: string, plan: KunciPlan): boolean {
  const fitur = fiturRute(pathname);
  return fitur === null || planMencakup(plan, fitur);
}
