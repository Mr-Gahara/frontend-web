import type { Lokasi } from "@/types/location";

/** Nilai pemilih lokasi untuk seluruh outlet. */
export const SEMUA_OUTLET = "SEMUA";

/**
 * Cakupan lokasi halaman di ruang outlet. Pemegang izin lintas outlet
 * (IZIN_LINTAS_OUTLET) melihat seluruh outlet; pengguna lain terkunci ke
 * lokasi aktif, yaitu outlet milik tenant, bukan lokasi pribadi pengguna.
 */
export type CakupanLokasiOutlet =
  | { status: "memuat" }
  | { status: "gagal" }
  | { status: "lintas"; lokasiOutlet: Lokasi[] }
  | { status: "terkunci"; lokasi: Lokasi | null; lokasiId: string };

export interface MasukanCakupan {
  sesiMemuat: boolean;
  lintasOutlet: boolean;
  daftarLokasi: Lokasi[] | undefined;
  gagalDaftar: boolean;
  lokasiAktif: Lokasi | null;
  memuatAktif: boolean;
  gagalAktif: boolean;
}

export function tentukanCakupan(m: MasukanCakupan): CakupanLokasiOutlet {
  // Selama sesi dipulihkan, permission belum diketahui: pemegang izin lintas
  // outlet jangan sampai sempat terkunci.
  if (m.sesiMemuat) return { status: "memuat" };

  if (m.lintasOutlet) {
    if (m.gagalDaftar) return { status: "gagal" };
    if (!m.daftarLokasi) return { status: "memuat" };
    return {
      status: "lintas",
      lokasiOutlet: m.daftarLokasi.filter((l) => l.tipe === "Outlet"),
    };
  }

  if (m.gagalAktif) return { status: "gagal" };
  if (m.memuatAktif) return { status: "memuat" };
  return { status: "terkunci", lokasi: m.lokasiAktif, lokasiId: m.lokasiAktif?.id ?? "" };
}

/**
 * locationID dikirim ke server; tipeLokasi disaring di klien karena backend
 * tidak mendukung filter tipe lokasi.
 */
export interface LingkupLokasi {
  locationID?: string;
  tipeLokasi?: string;
}

/** null berarti daftar belum boleh dimuat (cakupan belum siap, gagal, atau lokasi kosong). */
export function lingkupOutlet(
  cakupan: CakupanLokasiOutlet,
  pilihan: string,
): LingkupLokasi | null {
  if (cakupan.status === "lintas") {
    return pilihan === SEMUA_OUTLET ? { tipeLokasi: "Outlet" } : { locationID: pilihan };
  }
  if (cakupan.status === "terkunci") {
    return cakupan.lokasiId ? { locationID: cakupan.lokasiId } : null;
  }
  return null;
}