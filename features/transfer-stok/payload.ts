import type { TransferItem } from "@/types/transferStok";

/*
 * Penyusunan payload PATCH /transferstok/:id/terima (backend 465b438).
 *
 * Setiap item surat jalan dikirim dengan itemId (items[].id dari respons) bila
 * ada, atau bahanBakuID sebagai cadangan; bahanBakuID hanya sah bila bahan itu
 * muncul sekali di surat jalan. qtyKirim dikirim dari catatan gudang (backend
 * menolak nilai yang berbeda), dan qtyTerima 0 sampai qtyKirim. qtyTerima 0
 * berarti barang tidak sampai: tidak ada stok maupun jurnal masuk untuk barang
 * itu. Stok tujuan bertambah pada bahan yang tercatat di surat jalan, bukan
 * dari body.
 */

/**
 * Pesan bila ada barang yang tidak dapat dikenali server: tanpa itemId dan
 * tanpa master bahan baku.
 */

export const PESAN_TANPA_MASTER =
  "Penerimaan belum dapat diproses: ada barang yang master bahan bakunya sudah dihapus, sehingga server tidak mengirim identitasnya. Hubungi admin.";


export interface IsianTerima {
  qtyTerima: number;
  catatanItem: string;
}

export interface ItemPayloadTerima {
  itemId?: string;
  bahanBakuID?: string;
  qtyKirim: number;
  qtyTerima: number;
  catatanItem: string | null;
}

export type HasilPayloadTerima =
  | { ok: true; payload: { items: ItemPayloadTerima[] } }
  | { ok: false; pesan: string };

/**
 * Menyusun payload dari item surat jalan (urutan dari server) dan isian per
 * item pada urutan yang sama. Seluruh item dikirim, termasuk yang diterima
 * penuh, agar jumlah dan catatan setiap barang tercatat eksplisit.
 *
 * Barang dikenali lewat itemId; bahanBakuID hanya cadangan untuk respons yang
 * belum membawa items[].id. Barang tanpa keduanya (master bahan baku terhapus
 * dan respons tanpa id item) tetap menahan penerimaan, karena server tidak
 * dapat mencocokkannya.
 */
export function susunPayloadTerima(
  items: TransferItem[],
  isian: IsianTerima[],
): HasilPayloadTerima {
  if (items.some((item) => !item.id && !item.bahanBaku?.id)) return { ok: false, pesan: PESAN_TANPA_MASTER };
  return {
    ok: true,
    payload: {
      items: items.map((item, indeks) => {
        const catatan = isian[indeks]?.catatanItem.trim() ?? "";
        return {
          ...(item.id ? { itemId: item.id } : { bahanBakuID: item.bahanBaku!.id }),
          qtyKirim: item.qtyKirim,
          qtyTerima: isian[indeks]?.qtyTerima ?? item.qtyKirim,
          catatanItem: catatan === "" ? null : catatan,
        };
      }),
    },
  };
}

export interface IsianRevisi {
  bahanBakuID: string;
  /** Teks isian, agar isian kosong tetap tampil kosong. */
  qtyKirim: string;
}

export type HasilPayloadRevisi =
  | { ok: true; payload: { items: { bahanBakuID: string; qtyKirim: number }[] } }
  | { ok: false; pesan: string };

export const PESAN_REVISI_KOSONG = "Minimal harus ada 1 barang dengan jumlah kirim lebih dari 0.";

/**
 * Menyusun payload PUT /transferstok/:id dari isian revisi. Aturan halaman
 * lama dipertahankan: baris tanpa barang, berjumlah 0, atau bukan angka
 * diabaikan, tetapi harus ada minimal satu baris valid. Backend mengganti
 * items apa adanya tanpa memeriksa jumlah pengajuan maupun stok
 * (kontrak/temuan.md butir 32), sehingga baris yang diabaikan hilang dari
 * surat jalan.
 */
export function susunPayloadRevisi(isian: IsianRevisi[]): HasilPayloadRevisi {
  const items = isian
    .map((i) => ({ bahanBakuID: i.bahanBakuID, qtyKirim: Number(i.qtyKirim) }))
    .filter((i) => i.bahanBakuID !== "" && Number.isFinite(i.qtyKirim) && i.qtyKirim > 0);
  if (items.length === 0) return { ok: false, pesan: PESAN_REVISI_KOSONG };
  return { ok: true, payload: { items } };
}