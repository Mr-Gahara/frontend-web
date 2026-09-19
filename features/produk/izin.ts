import { IZIN } from "@/lib/auth/permissions";

/**
 * Menentukan apakah daftar produk boleh dibaca.
 *
 * GET /produk menerima salah satu dari read-produk atau akses-pos
 * (produkRoutes.js), berbeda dengan bolehBukaHalaman yang mensyaratkan
 * seluruh izin. Pengguna dengan akses-pos saja tetap dapat membaca produk.
 */
export function bolehBacaProduk(dimiliki: string[]): boolean {
  return dimiliki.includes(IZIN.produk) || dimiliki.includes("akses-pos");
}