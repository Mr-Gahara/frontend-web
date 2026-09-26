import type { PerubahanPenjualan } from "./api";
import type { JenisPenjualan, PenjualanRequest } from "@/types/penjualan";

export interface IsianPenjualan {
  penggunaID: string;
  pelangganID: string;
  jenisPenjualan: JenisPenjualan;
  tanggal: Date;
  jam: string;
  menit: string;
  items: { produkID: string; jumlah: number; diskonItemIDs: string[] }[];
  diskonGlobalIDs: string[];
  keterangan: string;
  locationID: string | undefined;
}

/** Pesan validasi form buat penjualan, atau null bila sah; teks pesan lama dipertahankan. */
export function validasiPenjualan(
  isian: Pick<IsianPenjualan, "penggunaID" | "pelangganID" | "items">,
): string | null {
  if (!isian.penggunaID) return "Sesi kasir tidak terdeteksi.";
  if (!isian.pelangganID) return "Silakan pilih pelanggan terlebih dahulu.";
  if (isian.items.some((item) => !item.produkID)) return "Semua baris item harus memiliki produk.";
  return null;
}

/**
 * Payload POST /penjualan. Web selalu membuat invoice DRAFT; finalisasi
 * dilakukan di detail.
 * - penggunaID dikirim hanya karena validator backend mewajibkannya;
 *   controller menggantinya dengan pengguna dari token.
 * - locationID: outlet tenant bagi pemegang read-location (keputusan K13a);
 *   tanpa izin itu tidak dikirim, dan penjualan dianggap milik outlet tenant.
 * - pajakTransaksiIDs tidak dikirim: backend menerapkan pajak transaksi aktif
 *   sendiri, sama dengan pratinjau di halaman.
 */
export function susunPayloadPenjualan(isian: IsianPenjualan): PenjualanRequest {
  const tanggal = new Date(isian.tanggal);
  tanggal.setHours(Number(isian.jam), Number(isian.menit), 0);
  return {
    penggunaID: isian.penggunaID,
    pelangganID: isian.pelangganID,
    jenisTransaksi: "INVOICE",
    jenisPenjualan: isian.jenisPenjualan,
    tanggalTransaksi: tanggal.toISOString(),
    itemPenjualan: isian.items.map(({ produkID, jumlah, diskonItemIDs }) => ({
      produkID,
      jumlah,
      ...(diskonItemIDs.length > 0 ? { diskonItemIDs } : {}),
    })),
    ...(isian.diskonGlobalIDs.length > 0 ? { diskonGlobalIDs: isian.diskonGlobalIDs } : {}),
    ...(isian.keterangan ? { keterangan: isian.keterangan } : {}),
    ...(isian.locationID ? { locationID: isian.locationID } : {}),
    simpanDraft: true,
  };
}

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