import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin tulis akun kas, sesuai routes/akunKasRoute.js backend 50eede7: PUT
 * /akunkas/:id memakai update-akunkas. Sunting isian, nonaktifkan, dan
 * aktifkan kembali memakai izin yang sama karena ketiganya lewat PUT.
 */
export const IZIN_AKUN_KAS = {
  ubah: IZIN.ubahAkunKas,
} as const;

export function aksiAkunKas(permissions: readonly string[]) {
  return {
    ubah: permissions.includes(IZIN_AKUN_KAS.ubah),
  };
}