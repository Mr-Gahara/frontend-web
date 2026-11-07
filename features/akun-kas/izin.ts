import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin tulis akun kas, sesuai routes/akunKasRoute.js backend 50eede7: POST
 * /akunkas memakai create-akunkas, dan PUT /akunkas/:id memakai
 * update-akunkas. Sunting isian, nonaktifkan, dan aktifkan kembali memakai
 * izin yang sama karena ketiganya lewat PUT.
 */
export const IZIN_AKUN_KAS = {
  buat: IZIN.buatAkunKas,
  ubah: IZIN.ubahAkunKas,
} as const;

export function aksiAkunKas(permissions: readonly string[]) {
  return {
    buat: permissions.includes(IZIN_AKUN_KAS.buat),
    ubah: permissions.includes(IZIN_AKUN_KAS.ubah),
  };
}