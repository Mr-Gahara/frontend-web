import { IZIN } from "@/lib/auth/permissions";

/**
 * Izin jurnal transfer, sesuai routes/jurnalTransferRoute.js backend yoga
 * 50eede7: GET memakai read-, POST create-, dan PUT (termasuk VOID) update-.
 */
export const IZIN_TRANSFER = {
  baca: IZIN.bacaJurnalTransfer,
  buat: IZIN.buatJurnalTransfer,
  batal: IZIN.ubahJurnalTransfer,
} as const;

export function aksiTransfer(permissions: readonly string[]) {
  return {
    baca: permissions.includes(IZIN_TRANSFER.baca),
    buat: permissions.includes(IZIN_TRANSFER.buat),
    batal: permissions.includes(IZIN_TRANSFER.batal),
  };
}