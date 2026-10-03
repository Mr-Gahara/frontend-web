import type { AkunKas } from "@/types/akunKas";

/** Akun kas yang dapat menerima pembayaran; aturan halaman pembayaran lama dipertahankan. */
export function akunKasAktif(daftar: AkunKas[]): AkunKas[] {
  return daftar.filter((a) => a.status === "aktif");
}

/** Akun kas yang sudah ditutup; ditampilkan terpisah dari kartu akun aktif (keputusan AK1a). */
export function akunKasNonAktif(daftar: AkunKas[]): AkunKas[] {
  return daftar.filter((a) => a.status !== "aktif");
}