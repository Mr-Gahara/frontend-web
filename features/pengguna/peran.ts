import type { PenggunaItem } from "@/types/pengguna";
import type { Role } from "@/types/role";

/**
 * Nama peran satu pengguna, dipakai kolom Role tabel pengguna, kalender
 * jadwal, dan widget absensi (keputusan rancangan butir 12, AB6). Urutannya:
 * role teks dari respons (JD14a), roleID hasil populate, roleID yang dicari
 * di daftar role, lalu "-" (butir 11).
 */
export function namaPeran(pengguna: Pick<PenggunaItem, "role" | "roleID">, roleList: Role[] = []): string {
  if (pengguna.role) return pengguna.role;
  if (typeof pengguna.roleID === "object" && pengguna.roleID !== null) {
    return pengguna.roleID.namaRole || "-";
  }
  if (typeof pengguna.roleID === "string") {
    return roleList.find((r) => r.id === pengguna.roleID)?.namaRole || "-";
  }
  return "-";
}