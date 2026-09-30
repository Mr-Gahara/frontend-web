import { lingkupOutlet, type CakupanLokasiOutlet } from "@/features/inventaris/cakupan";
import type { Paginasi } from "@/lib/api/normalize";
import type { Penjualan, PenjualanFilterParams } from "@/types/penjualan";

/**
 * Filter daftar yang dikirim sebagai query. Sejak backend 465b438 filter ini
 * diterapkan di basis data bersama pagination (penjualanService._filterDatabase),
 * jadi tidak disaring ulang di klien. Nilai kosong tidak dikirim.
 */
export function filterServerPenjualan(filter: PenjualanFilterParams): Record<string, string> {
  const hasil: Record<string, string> = {};
  for (const [kunci, nilai] of Object.entries(filter)) {
    if (nilai !== undefined && nilai !== "") hasil[kunci] = String(nilai);
  }
  return hasil;
}

/** Lingkup outlet daftar penjualan: seluruh penjualan tenant, atau satu lokasi. */
export type LingkupPenjualan =
  | { jenis: "semua" }
  | { jenis: "lokasi"; locationID: string; outletTenantId: string };

export interface MasukanLingkupPenjualan {
  sesiMemuat: boolean;
  bolehCakupan: boolean;
  cakupan: CakupanLokasiOutlet;
  pilihan: string;
  outletTenantId: string;
  memuatOutletTenant: boolean;
}

/**
 * Pengguna tanpa read-location melihat seluruh penjualan tenant (keputusan
 * K11b). Pemegang izin lintas outlet yang memilih "Semua Outlet" juga,
 * karena penjualan hanya terjadi di outlet. Selain itu lingkupnya satu
 * lokasi. Null berarti belum siap: sesi, lokasi, atau outlet tenant masih
 * dimuat, gagal, atau tenant belum punya outlet.
 */
export function tentukanLingkupPenjualan(m: MasukanLingkupPenjualan): LingkupPenjualan | null {
  if (m.sesiMemuat) return null;
  if (!m.bolehCakupan) return { jenis: "semua" };
  const lingkup = lingkupOutlet(m.cakupan, m.pilihan);
  if (!lingkup) return null;
  if (!lingkup.locationID) return { jenis: "semua" };
  if (m.memuatOutletTenant) return null;
  return { jenis: "lokasi", locationID: lingkup.locationID, outletTenantId: m.outletTenantId };
}

/**
 * Penjualan tanpa locationID (draf dari web sebelum locationID dikirim)
 * dianggap milik outlet tenant, sama dengan cadangan backend saat
 * finalisasi (lokasi Outlet pertama tenant).
 */
export function dalamLingkupPenjualan(p: Penjualan, lingkup: LingkupPenjualan): boolean {
  if (lingkup.jenis === "semua") return true;
  return (p.locationID ?? lingkup.outletTenantId) === lingkup.locationID;
}

export function saringPenjualan(daftar: Penjualan[], lingkup: LingkupPenjualan): Penjualan[] {
  return daftar.filter((p) => dalamLingkupPenjualan(p, lingkup));
}

export interface NavigasiHalaman {
  teks: string;
  sebelumnya: boolean;
  berikutnya: boolean;
}

/**
 * Keterangan dan tombol navigasi halaman daftar. Tanpa pagination (belum
 * dimuat) kedua tombol nonaktif. Halaman di luar jumlah halaman, misalnya
 * setelah baris terakhir halaman terakhir dihapus, tetap dapat mundur.
 */
export function navigasiHalaman(pagination: Paginasi | null, halaman: number): NavigasiHalaman {
  if (!pagination) return { teks: "", sebelumnya: false, berikutnya: false };
  const jumlahHalaman = Math.max(1, pagination.totalPages);
  return {
    teks: `Halaman ${halaman} dari ${jumlahHalaman} (${pagination.total} penjualan)`,
    sebelumnya: halaman > 1,
    berikutnya: halaman < pagination.totalPages,
  };
}