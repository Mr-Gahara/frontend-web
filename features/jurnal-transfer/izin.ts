import { IZIN } from "@/lib/auth/permissions";
import type { JurnalTransfer } from "@/types/jurnalTransfer";

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
/**
 * Batalkan hanya untuk transfer Aktif yang dicatat manual: Pindah Dana dari buka
 * kasir selalu ditolak 409 (B371), dan sejak backend c4aae0d asalnya terbaca
 * dari respons (B386, butir 196). Keterangan tidak dipakai, karena dapat diubah.
 */
export function bolehBatalTransfer(transfer: Pick<JurnalTransfer, "status" | "asal">, bolehBatal: boolean) {
  return bolehBatal && transfer.status === "AKTIF" && transfer.asal !== "buka-kasir";
}
