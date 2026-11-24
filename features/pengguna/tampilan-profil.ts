import type { SlugTab } from "@/lib/tab-url";
import type { PenggunaDetail } from "@/types/pengguna";

/** Teks akses ringkasan profil (PU1a): "Web", "Aplikasi", atau keduanya. */
export function teksAkses(akses: PenggunaDetail["aksesType"]): string {
  const web = akses.includes("web");
  const app = akses.includes("app");
  if (web && app) return "Web dan Aplikasi";
  if (web) return "Web";
  if (app) return "Aplikasi";
  return "-";
}

/** Lokasi kerja (B339): nama lokasinya, atau "Tidak dibatasi" bila kosong (LK1a). */
export function teksLokasiKerja(lokasi: PenggunaDetail["lokasiKerja"]): string {
  return lokasi?.nama ?? "Tidak dibatasi";
}

export function teksStatusPengguna(status: PenggunaDetail["status"]): string {
  return status === "aktif" ? "Aktif" : "Non-aktif";
}

/** Baris kedua kepala profil: peran lalu toko, tanpa bagian yang belum termuat. */
export function teksPeranToko(peran: string, namaToko: string): string {
  return [peran, namaToko].filter((t) => t.trim() !== "").join(" · ");
}

/** Slug tab laman profil di ?tab= (lib/tab-url.ts); Data Diri bawaan tanpa query. */
export type TabProfil = "data-diri" | "pin";
export const TAB_PROFIL: readonly TabProfil[] = ["data-diri", "pin"];
export const SLUG_TAB_PROFIL: SlugTab<TabProfil> = { "data-diri": "data-diri", pin: "keamanan-pin" };
