import { IZIN } from "@/lib/auth/permissions";
import type { Lokasi } from "@/types/location";

/**
 * Keputusan layout ruang gudang (keputusan GD4a). Gerbang ruang tetap
 * read-dashboard-gudang, sejalan dengan backend (penggunaCrudService),
 * sidebar, dan layout outlet. Pengalihan hanya ke tujuan yang tidak mungkin
 * mengirim balik ke ruang gudang; galat memuat lokasi dan gudang yang belum
 * ada bagi pengguna tanpa create-location tampil sebagai pesan di tempat,
 * sehingga pengalihan berputar antara /dashboard dan /dashboard/gudang
 * hilang. Pengguna tanpa read-location membuka ruang gudang tanpa
 * pemeriksaan gudang, karena setiap halaman punya gate sendiri; hanya
 * halaman setup yang menuntutnya, agar gudang tidak terdaftar ganda.
 */
export type AksesGudang =
  | "memuat"
  | "keluar"
  | "ditolak"
  | "gagal"
  | "setup"
  | "belum-ada"
  | "tanpa-izin-lokasi"
  | "ke-dashboard"
  | "izinkan";

export interface MasukanAksesGudang {
  sesiMemuat: boolean;
  sudahMasuk: boolean;
  permissions: readonly string[];
  diSetup: boolean;
  lokasi: { memuat: boolean; gagal: boolean; daftar: Lokasi[] | undefined };
}

export function tentukanAksesGudang(m: MasukanAksesGudang): AksesGudang {
  if (m.sesiMemuat) return "memuat";
  if (!m.sudahMasuk) return "keluar";
  if (!m.permissions.includes(IZIN.dashboardGudang)) return "ditolak";
  if (!m.permissions.includes(IZIN.location)) {
    return m.diSetup ? "tanpa-izin-lokasi" : "izinkan";
  }
  if (m.lokasi.gagal) return "gagal";
  if (m.lokasi.memuat || !m.lokasi.daftar) return "memuat";
  if (m.lokasi.daftar.some((l) => l.tipe === "Gudang")) {
    return m.diSetup ? "ke-dashboard" : "izinkan";
  }
  if (!m.permissions.includes(IZIN.buatLocation)) return "belum-ada";
  return m.diSetup ? "izinkan" : "setup";
}

const TUJUAN: Partial<Record<AksesGudang, string>> = {
  keluar: "/login",
  ditolak: "/dashboard",
  setup: "/dashboard/gudang/setup",
  "ke-dashboard": "/dashboard/gudang",
};

/** Tujuan pengalihan untuk sebuah keputusan, atau null bila halaman tetap di tempat. */
export function tujuanAksesGudang(akses: AksesGudang): string | null {
  return TUJUAN[akses] ?? null;
}