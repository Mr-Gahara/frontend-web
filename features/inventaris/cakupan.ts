import type { Lokasi } from "@/types/location";

/** Nilai pemilih lokasi owner untuk seluruh outlet. */
export const SEMUA_OUTLET = "SEMUA";

/**
 * Cakupan lokasi halaman di ruang outlet.
 * Owner melihat seluruh outlet; staf hanya lokasi aktifnya.
 */
export type CakupanLokasiOutlet =
  | { status: "memuat" }
  | { status: "gagal" }
  | { status: "owner"; lokasiOutlet: Lokasi[] }
  | { status: "staf"; lokasi: Lokasi | null; lokasiId: string };

export interface MasukanCakupan {
  sesiMemuat: boolean;
  owner: boolean;
  daftarLokasi: Lokasi[] | undefined;
  gagalDaftar: boolean;
  lokasiAktif: Lokasi | null;
  memuatAktif: boolean;
  gagalAktif: boolean;
}

export function tentukanCakupan(m: MasukanCakupan): CakupanLokasiOutlet {
  // Selama sesi dipulihkan, peran belum diketahui: owner jangan sampai
  // sempat diperlakukan sebagai staf.
  if (m.sesiMemuat) return { status: "memuat" };

  if (m.owner) {
    if (m.gagalDaftar) return { status: "gagal" };
    if (!m.daftarLokasi) return { status: "memuat" };
    return {
      status: "owner",
      lokasiOutlet: m.daftarLokasi.filter((l) => l.tipe === "Outlet"),
    };
  }

  if (m.gagalAktif) return { status: "gagal" };
  if (m.memuatAktif) return { status: "memuat" };
  return { status: "staf", lokasi: m.lokasiAktif, lokasiId: m.lokasiAktif?.id ?? "" };
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
  if (cakupan.status === "owner") {
    return pilihan === SEMUA_OUTLET ? { tipeLokasi: "Outlet" } : { locationID: pilihan };
  }
  if (cakupan.status === "staf") {
    return cakupan.lokasiId ? { locationID: cakupan.lokasiId } : null;
  }
  return null;
}