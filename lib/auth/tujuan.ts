/**
 * Aturan pengalihan guard, sebagai fungsi murni agar teruji unit.
 *
 * Dua jenis sesi: pengguna toko (token akun dan token pengguna) dan admin
 * platform (token akun saja, tanpa pengguna; keputusan PA1a). Status sesi
 * hanya mengikuti token pengguna, sehingga admin yang sudah masuk selalu
 * berstatus "keluar" dan dikenali dari role akunnya.
 */
import type { StatusSesi } from "./session";

export interface KeadaanSesi {
  status: StatusSesi;
  adaTokenAkun: boolean;
  adalahAdmin: boolean;
}

/** Tujuan pengalihan guard dashboard; null berarti tetap di halaman. */
export function tujuanGuardDashboard(k: KeadaanSesi): string | null {
  if (k.status !== "keluar") return null;
  if (!k.adaTokenAkun) return "/login";
  return k.adalahAdmin ? "/admin" : "/login/pengguna";
}

/** Tujuan pengalihan guard panel admin; null berarti tetap di halaman. */
export function tujuanGuardAdmin(k: KeadaanSesi): string | null {
  if (k.status === "memuat") return null;
  if (!k.adaTokenAkun) return "/login";
  if (k.adalahAdmin) return null;
  return k.status === "masuk" ? "/dashboard" : "/login/pengguna";
}
/** Ringkasan status setup yang dibaca guard wizard (features/setup/status.ts). */
export interface KeadaanSetup {
  tuntas: boolean;
  ownerTerdaftar: boolean;
}

/** Satu-satunya tujuan kembali yang diterima login pengguna, agar parameter tidak menjadi pengalih terbuka. */
export const KEMBALI_SETUP = "/setup";
export const URL_LOGIN_OWNER_SETUP = `/login/pengguna?kembali=${encodeURIComponent(KEMBALI_SETUP)}`;

/** Tujuan sesudah login pengguna: /setup bila diminta, selain itu dashboard. */
export function tujuanSesudahLoginPengguna(kembali: string | null): string {
  return kembali === KEMBALI_SETUP ? KEMBALI_SETUP : "/dashboard";
}

/**
 * Meneruskan ?kembali=/setup ke halaman lain di jalur login pengguna (reset
 * PIN Owner, OA1a), agar Owner yang sedang setup kembali ke wizard setelah
 * masuk lagi. Nilai selain /setup tidak diteruskan, sama dengan
 * tujuanSesudahLoginPengguna.
 */
export function denganKembali(path: string, kembali: string | null): string {
  return kembali === KEMBALI_SETUP ? `${path}?kembali=${encodeURIComponent(KEMBALI_SETUP)}` : path;
}

/**
 * Tujuan pengalihan guard wizard setup; null berarti tetap di halaman.
 * setup null berarti status setup belum termuat. Setup yang tuntas tidak
 * dibuka lagi; Owner yang sudah terdaftar tetapi belum masuk (browser lain
 * atau cookie habis) masuk lewat login PIN lalu kembali ke wizard.
 */
export function tujuanGuardSetup(k: KeadaanSesi, setup: KeadaanSetup | null): string | null {
  if (k.status === "memuat") return null;
  if (!k.adaTokenAkun) return "/login";
  if (k.adalahAdmin) return "/admin";
  if (!setup) return null;
  if (setup.tuntas) return k.status === "masuk" ? "/dashboard" : "/login/pengguna";
  if (setup.ownerTerdaftar && k.status !== "masuk") return URL_LOGIN_OWNER_SETUP;
  return null;
}
