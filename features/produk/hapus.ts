import { isApiError } from "@/lib/api/error";

/**
 * Hapus produk dijawab 404 bila produk itu sudah dihapus lebih dulu,
 * misalnya oleh pengguna lain di tab lain. Barisnya tidak lagi ada di server,
 * sehingga dialog ditutup dan daftar dimuat ulang, bukan diulang
 * (pemilik proyek, 24 November 2026). Galat lain tetap menahan dialog.
 */
export const produkSudahTerhapus = (err: unknown): boolean => isApiError(err) && err.status === 404;

export const PESAN_PRODUK_SUDAH_TERHAPUS = "Produk sudah dihapus.";
