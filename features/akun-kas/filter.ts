import type { AkunKas } from "@/types/akunKas";

/** Akun kas yang dapat menerima pembayaran; aturan halaman pembayaran lama dipertahankan. */
export function akunKasAktif(daftar: AkunKas[]): AkunKas[] {
  return daftar.filter((a) => a.status === "aktif");
}