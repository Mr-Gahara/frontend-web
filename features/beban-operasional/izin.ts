import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin beban, sesuai routes/bebanOperasionalRoute.js backend ridho 00de455:
 * GET memakai read-, POST create-, dan PUT update-, termasuk VOID.
 */
export const IZIN_BEBAN = {
  baca: IZIN.bebanOperasional,
  buat: IZIN.buatBebanOperasional,
  ubah: IZIN.ubahBebanOperasional,
} as const;

export function aksiBeban(permissions: readonly string[]) {
  return {
    baca: permissions.includes(IZIN_BEBAN.baca),
    buat: permissions.includes(IZIN_BEBAN.buat),
    ubah: permissions.includes(IZIN_BEBAN.ubah),
  };
}