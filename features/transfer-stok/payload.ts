import type { TransferItem } from "@/types/transferStok";

/*
 * Penyusunan payload PATCH /transferstok/:id/terima.
 *
 * Backend mengganti seluruh items surat jalan dengan items dari body
 * (transferStokService.updateStatus, `items: updates.items || transfer.items`),
 * lalu menambah stok outlet per item. Karena itu setiap item surat jalan wajib
 * dikirim dengan bahanBakuID dan qtyKirim dari server: item yang tertinggal
 * hilang dari surat jalan dan tidak menambah stok.
 */

/**
 * Backend menghitung stok masuk sebagai `item.qtyTerima || item.qtyKirim`,
 * sehingga qtyTerima 0 menambah stok outlet sebesar qtyKirim, sementara surat
 * jalan mencatat 0. Selama itu jumlah 0 ditahan di frontend. Konsekuensinya,
 * surat jalan yang salah satu barangnya tidak diterima sama sekali tertahan
 * DIKIRIM sampai backend diperbaiki.
 *
 * Balik menjadi true setelah backend memakai `item.qtyTerima ?? item.qtyKirim`.
 * Payload sudah membawa 0 apa adanya, sehingga tidak ada perubahan lain; lalu
 * jalankan test.fixme "jumlah diterima 0 terkirim apa adanya" di
 * tests/e2e/inventaris/penerimaanBarang/terima-penerimaan.spec.ts.
 */
export const SERVER_TERIMA_JUMLAH_NOL = false;

export const PESAN_TANPA_MASTER =
  "Penerimaan belum dapat diproses: ada barang yang master bahan bakunya sudah dihapus, sehingga server tidak mengirim identitasnya. Hubungi admin.";

export const PESAN_JUMLAH_NOL =
  "Penerimaan belum dapat diproses: jumlah diterima 0 masih dicatat server sebagai diterima penuh. Hubungi gudang.";

export interface IsianTerima {
  qtyTerima: number;
  catatanItem: string;
}

export interface ItemPayloadTerima {
  bahanBakuID: string;
  qtyKirim: number;
  qtyTerima: number;
  catatanItem: string | null;
}

export type HasilPayloadTerima =
  | { ok: true; payload: { items: ItemPayloadTerima[] } }
  | { ok: false; pesan: string };

/**
 * Menyusun payload dari item surat jalan (urutan dari server) dan isian per
 * item pada urutan yang sama. Argumen `terimaNol` hanya dibuka agar kedua
 * cabang dapat diuji; halaman memakai nilai bawaan.
 *
 * Item tanpa bahanBaku (master bahan bakunya dihapus) selalu menahan
 * penerimaan. Backend tidak mengirim id-nya, dan mengirim items tanpa item itu
 * menghapusnya dari surat jalan. Penahanan ini baru dapat dicabut bila kontrak
 * terima berubah, misalnya backend tidak lagi mengganti seluruh items atau
 * tetap mengirim id bahan baku yang tidak ter-populate, dan bentuk payload ikut
 * disesuaikan saat itu.
 */
export function susunPayloadTerima(
  items: TransferItem[],
  isian: IsianTerima[],
  terimaNol: boolean = SERVER_TERIMA_JUMLAH_NOL,
): HasilPayloadTerima {
  if (items.some((item) => !item.bahanBaku?.id)) return { ok: false, pesan: PESAN_TANPA_MASTER };
  if (!terimaNol && isian.some((i) => i.qtyTerima === 0)) return { ok: false, pesan: PESAN_JUMLAH_NOL };
  return {
    ok: true,
    payload: {
      items: items.map((item, indeks) => {
        const catatan = isian[indeks]?.catatanItem.trim() ?? "";
        return {
          bahanBakuID: item.bahanBaku!.id,
          qtyKirim: item.qtyKirim,
          qtyTerima: isian[indeks]?.qtyTerima ?? item.qtyKirim,
          catatanItem: catatan === "" ? null : catatan,
        };
      }),
    },
  };
}