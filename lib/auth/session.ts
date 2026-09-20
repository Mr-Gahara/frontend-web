/**
 * Store sesi di memori.
 *
 * Sebelumnya token disimpan di sessionStorage, yang dapat dibaca skrip
 * mana pun di halaman (risiko XSS) dan terisolasi per tab, sehingga tab
 * baru selalu memaksa login PIN ulang. Karena backend hanya mengizinkan
 * satu sesi web per pengguna, login ulang itu justru mematikan sesi di
 * tab pertama.
 *
 * Kini access token hanya hidup di memori. Sumber kebenarannya adalah
 * cookie refresh httpOnly milik backend, yang tidak terbaca JavaScript.
 * Saat halaman dimuat, sesi dipulihkan lewat endpoint refresh.
 *
 * Payload token pengguna ikut disimpan di sini agar komponen tidak perlu
 * mendekode JWT sendiri-sendiri (sebelumnya dilakukan di 14 tempat).
 */

import { decodeJWT, isTokenExpired } from "@/lib/decodeToken";

export interface PenggunaSesi {
  id: string;
  nama?: string;
  role: string;
  roleID?: string;
  permissions: string[];
  tenantID: string;
  tenantName?: string;
  aksesType?: string[];
  loginType?: string;
}

export type StatusSesi = "memuat" | "masuk" | "keluar";

interface IsiSesi {
  tokenAkun: string | null;
  tokenPengguna: string | null;
  pengguna: PenggunaSesi | null;
  status: StatusSesi;
}

let sesi: IsiSesi = {
  tokenAkun: null,
  tokenPengguna: null,
  pengguna: null,
  status: "memuat",
};

const pelanggan = new Set<() => void>();

function beriTahu() {
  pelanggan.forEach((fn) => fn());
}

/** Berlangganan perubahan sesi. Mengembalikan fungsi pembatalan. */
export function langgananSesi(fn: () => void): () => void {
  pelanggan.add(fn);
  return () => pelanggan.delete(fn);
}

/** Snapshot sesi saat ini. Stabil selama sesi tidak berubah. */
export function bacaSesi(): IsiSesi {
  return sesi;
}

export const tokenAkun = () => sesi.tokenAkun;
export const tokenPengguna = () => sesi.tokenPengguna;

/**
 * Mengubah payload token pengguna menjadi bentuk yang dipakai aplikasi.
 * Sumber bentuk: docs/kontrak/README.md, bagian membaca izin.
 */
function keSesiPengguna(token: string): PenggunaSesi | null {
  const p = decodeJWT(token);
  if (!p || !p.id || !p.tenantID) return null;
  return {
    id: String(p.id),
    nama: p.nama ? String(p.nama) : undefined,
    role: String(p.role ?? ""),
    roleID: p.roleID ? String(p.roleID) : undefined,
    permissions: Array.isArray(p.permissions) ? p.permissions.map(String) : [],
    tenantID: String(p.tenantID),
    tenantName: p.tenantName ? String(p.tenantName) : undefined,
    aksesType: Array.isArray(p.aksesType) ? p.aksesType.map(String) : undefined,
    loginType: p.loginType ? String(p.loginType) : undefined,
  };
}

export function setTokenAkun(token: string | null) {
  sesi = { ...sesi, tokenAkun: token };
  beriTahu();
}

export function setTokenPengguna(token: string | null) {
  const pengguna = token ? keSesiPengguna(token) : null;
  sesi = {
    ...sesi,
    tokenPengguna: pengguna ? token : null,
    pengguna,
    status: pengguna ? "masuk" : sesi.status === "memuat" ? "memuat" : "keluar",
  };
  beriTahu();
}

/** Menandai pemulihan sesi selesai tanpa hasil: pengguna belum masuk. */
/**
 * Menandai bahwa pemulihan sesi selesai tanpa sesi pengguna.
 *
 * Token akun sengaja dipertahankan: tepat setelah login akun, pengguna
 * memang belum punya sesi PIN, dan token itu justru dibutuhkan halaman
 * login PIN untuk memanggil pin-login.
 */
export function tandaiKeluar() {
  sesi = { ...sesi, tokenPengguna: null, pengguna: null, status: "keluar" };
  beriTahu();
}

/** Mengakhiri sesi sepenuhnya: logout dan pergantian akun bisnis. */
export function akhiriSesi() {
  sesi = { tokenAkun: null, tokenPengguna: null, pengguna: null, status: "keluar" };
  beriTahu();
}

/** Token akun ada dan belum kedaluwarsa. */
export function punyaTokenAkunValid(): boolean {
  return !!sesi.tokenAkun && !isTokenExpired(sesi.tokenAkun);
}

/**
 * Owner memegang seluruh permission di backend (level 100), sehingga
 * pemeriksaan izin cukup berbasis daftar permission. Nama role tidak
 * dipakai sebagai jalan pintas, karena backend mengenali owner dari
 * level, bukan nama.
 */
export function punyaIzin(izin?: string): boolean {
  if (!izin) return true;
  return sesi.pengguna?.permissions.includes(izin) ?? false;
}

export function punyaSalahSatuIzin(daftar: string[]): boolean {
  return daftar.some((i) => punyaIzin(i));
}