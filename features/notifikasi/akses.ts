import { bolehBukaHalaman } from "@/lib/auth/permissions";
import { fiturRute, planMencakup, type FiturPlan } from "@/lib/auth/fitur-plan";
import type { KunciPlan } from "@/types/langganan";

/**
 * Siapa boleh membuka tautan sebuah pemberitahuan (LN2a: tautan hanya bagi
 * pemegang izinnya). Satu pintu dengan sidebar dan gerbang halaman:
 * IZIN_HALAMAN untuk izin, plan untuk fitur rute, dan setup fitur, karena
 * rute fitur yang setupnya belum selesai masih terkunci.
 */
export interface AksesTautan {
  permissions: readonly string[];
  plan: KunciPlan;
  /** Setup fitur selesai (status setup); fitur yang belum diketahui dianggap belum siap. */
  fiturSiap: Partial<Record<FiturPlan, boolean>>;
}

/** Fitur plan dapat dipakai: termasuk plan dan setupnya selesai. */
export function fiturAktif(akses: AksesTautan, fitur: FiturPlan): boolean {
  return planMencakup(akses.plan, fitur) && akses.fiturSiap[fitur] === true;
}

/**
 * Tautan boleh ditampilkan. `pola` adalah kunci IZIN_HALAMAN bila href
 * memuat id (misalnya "/dashboard/outlet/inventaris/produk/[id]/edit").
 */
export function bolehTautan(akses: AksesTautan, href: string, pola: string = href): boolean {
  const jalur = pola.split("?")[0];
  if (!bolehBukaHalaman(jalur, [...akses.permissions])) return false;
  const fitur = fiturRute(jalur);
  return fitur === null || fiturAktif(akses, fitur);
}
