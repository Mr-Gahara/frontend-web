import { lingkupOutlet, type CakupanLokasiOutlet } from "@/features/inventaris/cakupan";
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

/** Pilihan jumlah baris daftar penjualan; backend menerima limit 1 sampai 100 (LIMIT_MAKS). */
export const PILIHAN_UKURAN_HALAMAN = [10, 20, 50, 100] as const;
export type UkuranHalaman = (typeof PILIHAN_UKURAN_HALAMAN)[number];
/** Bawaan setiap kali halaman dibuka; pilihan lain tidak diingat. */
export const UKURAN_HALAMAN_BAWAAN: UkuranHalaman = 10;

/** Kolom daftar penjualan yang diurutkan server (GET /penjualan sort, backend yoga 8fad4c0). */
export const KOLOM_URUT_PENJUALAN = ["noReferensi", "tanggalTransaksi", "totalTagihan"] as const;

/**
 * Parameter sort dan order dari urutan tabel. Kosong berarti urutan bawaan
 * backend (terbaru dulu); kolom di luar KOLOM_URUT_PENJUALAN tidak dikirim,
 * karena backend menolaknya 400.
 */
export function paramUrutanPenjualan(urutan: readonly { id: string; desc: boolean }[]): Record<string, string> {
  const pertama = urutan[0];
  if (!pertama || !(KOLOM_URUT_PENJUALAN as readonly string[]).includes(pertama.id)) return {};
  return { sort: pertama.id, order: pertama.desc ? "desc" : "asc" };
}
