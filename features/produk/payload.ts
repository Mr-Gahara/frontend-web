/**
 * Menyusun payload POST dan PUT /produk dari nilai form.
 *
 * Penanganan sementara bug backend: PUT /produk/:id memeriksa
 * if (payload.resep), sehingga resep kosong (array kosong bernilai truthy)
 * membuat produkService menghitung ulang stok menjadi 0. Produk tanpa resep
 * yang bukan unlimited lalu tidak dapat dijual, karena inventoryService
 * mensyaratkan stok mencukupi. Karena itu resep hanya dikirim bila produk
 * sekarang memiliki resep, atau sebelumnya memiliki resep sehingga resep lama
 * perlu dihapus. Sederhanakan setelah backend memeriksa panjang resep seperti
 * pada create.
 */

import type { ProdukRequest } from "@/types/produk";
import type { NilaiFormProduk } from "./schema";

export function susunPayloadProduk(
  nilai: NilaiFormProduk,
  opsi: { resepAwalAda: boolean },
): ProdukRequest {
  const adaResep = nilai.resep.length > 0;
  const isUnlimitedStok = adaResep ? false : nilai.isUnlimitedStok;

  const payload: ProdukRequest = {
    namaProduk: nilai.namaProduk,
    kategoriID: nilai.kategoriID,
    hargaDasar: nilai.hargaDasar,
    hargaJual: nilai.hargaJual,
    gambarProduk: nilai.gambarProduk,
    keterangan: nilai.keterangan,
    isUnlimitedStok,
    stok: adaResep || isUnlimitedStok ? 0 : nilai.stok,
  };

  if (adaResep || opsi.resepAwalAda) payload.resep = nilai.resep;
  return payload;
}