import type { Diskon, DiskonCakupan } from "@/types/diskon";

/** Diskon aktif untuk satu cakupan; aturan halaman buat penjualan lama dipertahankan. */
export function diskonAktif(daftar: Diskon[], cakupan: DiskonCakupan): Diskon[] {
  return daftar.filter((d) => d.status === "Aktif" && d.cakupan === cakupan);
}