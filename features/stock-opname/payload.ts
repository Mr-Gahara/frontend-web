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
  /** null berarti belum dihitung; hanya dikirim bila server menerimanya. */
  qtyPhysical?: number | null;
  catatanItem?: string;
}

export interface HasilHitungan {
  payload: { items: ItemHitungan[] };
  /** itemId yang berubah tetapi tidak dikirim karena hitungannya kosong. */
  ditahan: string[];
}

/**
 * Penanganan sementara ketidakselarasan backend. stockOpnameService.updateItems
 * menjalankan validateUpdateItems (validators/stockOpnameValidator.js baris 60
 * sampai 64) sebelum loop pembaruan, dan validator itu menolak qtyPhysical
 * yang null maupun tidak dikirim. Akibatnya loop service yang sudah menerima
 * null sebagai "belum dihitung" tidak pernah tercapai. Selama bernilai false:
 * - setiap item yang dikirim selalu membawa qtyPhysical angka, sehingga
 *   mengubah catatan saja tetap berjalan;
 * - item berubah yang hitungannya kosong tidak dikirim, dan dilaporkan lewat
 *   ditahan agar halaman memberi tahu pengguna.
 * Konsekuensi: item yang hanya berubah catatannya ikut mengirim hitungan yang
 * tampil di layar, sehingga hitungan staf lain untuk item yang sama yang
 * tersimpan setelah halaman dimuat dapat tertimpa. Ubah menjadi true setelah
 * validator backend menerima null dan field yang tidak dikirim.
 */
export const SERVER_TERIMA_HITUNGAN_KOSONG = false;

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
 * nilai tersimpan di server. Isian kosong berarti belum dihitung, dan catatan
 * yang dihapus dikirim sebagai string kosong.
 *
 * Bila server menerima hitungan kosong, hanya field yang berubah yang dikirim
 * (backend membiarkan field yang tidak dikirim), sehingga hitungan staf lain
 * yang tersimpan setelah halaman dimuat tidak tertimpa. Bila belum, lihat
 * SERVER_TERIMA_HITUNGAN_KOSONG.
 */
export function susunPayloadHitungan(
  isian: Record<string, IsianItem>,
  server: Record<string, NilaiServer>,
  serverTerimaKosong = SERVER_TERIMA_HITUNGAN_KOSONG,
): HasilHitungan {
  const items: ItemHitungan[] = [];
  const ditahan: string[] = [];
  for (const [itemId, data] of Object.entries(isian)) {
    const asal = server[itemId] ?? { qtyPhysical: null, catatanItem: null };
    const teksQty = data.qtyPhysical.trim();
    const qty = teksQty === "" ? null : Number(teksQty);
    const catatan = data.catatanItem.trim();
    const qtyBerubah = qty !== asal.qtyPhysical;
    const catatanBerubah = catatan !== (asal.catatanItem ?? "");
    if (!qtyBerubah && !catatanBerubah) continue;

    if (serverTerimaKosong) {
      const item: ItemHitungan = { itemId };
      if (qtyBerubah) item.qtyPhysical = qty;
      if (catatanBerubah) item.catatanItem = catatan;
      items.push(item);
      continue;
    }

    if (qty === null) {
      ditahan.push(itemId);
      continue;
    }
    const item: ItemHitungan = { itemId, qtyPhysical: qty };
    if (catatanBerubah) item.catatanItem = catatan;
    items.push(item);
  }
  return { payload: { items }, ditahan };
}
