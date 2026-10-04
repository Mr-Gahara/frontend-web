/**
 * Izin jurnal transfer, sesuai routes/jurnalTransferRoute.js backend yoga
 * 50eede7: GET memakai read-, POST create-, dan PUT (termasuk VOID) update-.
 */
export const IZIN_TRANSFER = {
  baca: "read-jurnal-transfer",
  buat: "create-jurnal-transfer",
  batal: "update-jurnal-transfer",
} as const;

export function aksiTransfer(permissions: readonly string[]) {
  return {
    baca: permissions.includes(IZIN_TRANSFER.baca),
    buat: permissions.includes(IZIN_TRANSFER.buat),
    batal: permissions.includes(IZIN_TRANSFER.batal),
  };
}