export interface IsianItem {
  qtyPhysical: string;
  catatanItem: string;
}

export interface ItemHitungan {
  itemId: string;
  qtyPhysical: number;
  catatanItem?: string;
}

/**
 * Payload simpan hitungan sementara.
 *
 * Backend menolak qtyPhysical kosong (stockOpnameService.updateItems) dan hanya
 * memperbarui item yang dikirim, sehingga item yang belum dihitung tidak ikut
 * dikirim. Akibatnya hitungan yang sudah tersimpan tidak dapat dikosongkan lagi
 * dari web sampai backend menerima null sebagai "belum dihitung".
 */
export function susunPayloadHitungan(isian: Record<string, IsianItem>): { items: ItemHitungan[] } {
  return {
    items: Object.entries(isian)
      .filter(([, data]) => data.qtyPhysical.trim() !== "")
      .map(([itemId, data]) => ({
        itemId,
        qtyPhysical: Number(data.qtyPhysical),
        ...(data.catatanItem.trim() ? { catatanItem: data.catatanItem.trim() } : {}),
      })),
  };
}