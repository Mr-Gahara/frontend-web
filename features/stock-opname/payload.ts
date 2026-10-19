export interface IsianItem {
  qtyPhysical: string;
  catatanItem: string;
}

/** Nilai tersimpan di server untuk satu item, sebagai pembanding isian. */
export interface NilaiServer {
  qtyPhysical: number | null;
  catatanItem: string | null;
}

export interface ItemHitungan {
  itemId: string;
  /** null berarti belum dihitung (kontrak/temuan.md butir 22, diperbaiki backend B98). */
  qtyPhysical?: number | null;
  catatanItem?: string;
}

/**
 * Isian awal tabel hitungan dari item dokumen opname: hitungan yang belum
 * diisi dan catatan kosong menjadi string kosong.
 */
export function isiAwalHitungan(
  items: { itemId: string; qtyPhysical: number | null; catatanItem: string | null }[],
): Record<string, IsianItem> {
  const isian: Record<string, IsianItem> = {};
  for (const item of items) {
    isian[item.itemId] = {
      qtyPhysical: item.qtyPhysical !== null && item.qtyPhysical !== undefined ? String(item.qtyPhysical) : "",
      catatanItem: item.catatanItem || "",
    };
  }
  return isian;
}

/** Nilai tersimpan per itemId dari item dokumen opname. */
export function petakanNilaiServer(
  items: readonly { itemId: string; qtyPhysical?: number | null; catatanItem?: string | null }[],
): Record<string, NilaiServer> {
  return Object.fromEntries(
    items.map((i) => [i.itemId, { qtyPhysical: i.qtyPhysical ?? null, catatanItem: i.catatanItem ?? null }]),
  );
}

/**
 * Payload simpan hitungan sementara: hanya item yang isiannya berbeda dari
 * nilai tersimpan di server, dan hanya field yang berubah. Isian kosong
 * dikirim sebagai qtyPhysical null (belum dihitung), dan catatan yang dihapus
 * sebagai string kosong. Backend membiarkan field yang tidak dikirim (B98),
 * sehingga mengubah catatan saja tidak menimpa hitungan staf lain yang
 * tersimpan setelah halaman dimuat.
 */
export function susunPayloadHitungan(
  isian: Record<string, IsianItem>,
  server: Record<string, NilaiServer>,
): { items: ItemHitungan[] } {
  const items: ItemHitungan[] = [];
  for (const [itemId, data] of Object.entries(isian)) {
    const asal = server[itemId] ?? { qtyPhysical: null, catatanItem: null };
    const teksQty = data.qtyPhysical.trim();
    const qty = teksQty === "" ? null : Number(teksQty);
    const catatan = data.catatanItem.trim();
    const qtyBerubah = qty !== asal.qtyPhysical;
    const catatanBerubah = catatan !== (asal.catatanItem ?? "");
    if (!qtyBerubah && !catatanBerubah) continue;

    const item: ItemHitungan = { itemId };
    if (qtyBerubah) item.qtyPhysical = qty;
    if (catatanBerubah) item.catatanItem = catatan;
    items.push(item);
  }
  return { items };
}
