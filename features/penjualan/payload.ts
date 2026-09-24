import type { PerubahanPenjualan } from "./api";

/**
 * Lokasi finalisasi: lokasi penjualan itu sendiri, lalu outlet tenant bagi
 * pemegang read-location (keputusan K11b). Bila keduanya tidak ada,
 * locationID tidak dikirim dan backend memakai lokasi Outlet pertama tenant
 * (penjualanService.update).
 */
export function lokasiFinalisasi(lokasiPenjualan: string | null, outletTenantId: string): string | undefined {
  return lokasiPenjualan || outletTenantId || undefined;
}

export function susunPayloadFinalisasi(locationID: string | undefined): PerubahanPenjualan {
  return locationID ? { finalize: true, locationID } : { finalize: true };
}