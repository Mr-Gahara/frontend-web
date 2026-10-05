import { IZIN } from "@/lib/auth/permissions";
import type { StatusTransfer } from "@/types/transferStok";

/** PATCH /transferstok/:id/kirim mewajibkan approve-transfer-stok. */
export function bolehKirimSuratJalan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.kirimTransferStok);
}

/** PUT /transferstok/:id memakai izin buat, create-transfer-stok. */
export function bolehRevisiSuratJalan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.buatTransferStok);
}

/** PATCH /transferstok/:id/batal mewajibkan cancel-transfer-stok. */
export function bolehBatalSuratJalan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.batalTransferStok);
}

/** PATCH /transferstok/:id/terima mewajibkan receive-transfer-stok. */
export function bolehTerimaSuratJalan(permissions: readonly string[]): boolean {
  return permissions.includes(IZIN.terimaTransferStok);
}

export interface AksiSuratJalan {
  kirim: boolean;
  revisi: boolean;
  batal: boolean;
  terima: boolean;
}

/**
 * Tombol aksi menurut status dan izin (keputusan rancangan butir 14). Kirim,
 * revisi, dan batal hanya untuk PENDING. Backend juga menerima batal dari
 * DIKIRIM, tetapi web tidak menawarkannya karena stok gudang langsung
 * dikembalikan saat barang masih di perjalanan (keputusan pemilik proyek,
 * kontrak/temuan.md butir 36). Terima hanya untuk DIKIRIM.
 */
export function aksiSuratJalan(status: StatusTransfer, permissions: readonly string[]): AksiSuratJalan {
  const pending = status === "PENDING";
  return {
    kirim: pending && bolehKirimSuratJalan(permissions),
    revisi: pending && bolehRevisiSuratJalan(permissions),
    batal: pending && bolehBatalSuratJalan(permissions),
    terima: status === "DIKIRIM" && bolehTerimaSuratJalan(permissions),
  };
}