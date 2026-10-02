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