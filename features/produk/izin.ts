import { IZIN } from "@/lib/auth/permissions";

/**
 * Menentukan apakah daftar produk boleh dibaca.
 *
 * GET /produk menerima salah satu dari read-produk atau akses-pos
 * (produkRoutes.js). Gate halaman produk di IZIN_HALAMAN hanya memakai
 * read-produk; fungsi ini dipakai saat halaman lain membutuhkan daftar
 * produk, sehingga pengguna dengan akses-pos saja tetap dapat membacanya.
 */
export function bolehBacaProduk(dimiliki: string[]): boolean {
  return dimiliki.includes(IZIN.produk) || dimiliki.includes("akses-pos");
}