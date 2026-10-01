/**
 * Menyusun payload POST dan PUT /produk dari nilai form.
 *
 * Resep hanya dikirim bila produk sekarang memiliki resep, atau sebelumnya
 * memiliki resep sehingga resep lama perlu dihapus. Sejak backend yoga
 * a66980c, resep kosong tidak lagi membuat stok dihitung ulang menjadi 0
 * (kontrak/temuan.md butir 11), sehingga stok yang dikirim tersimpan apa
 * adanya; aturan ini dipertahankan agar payload tidak membawa field yang
 * tidak berubah.
 *
 * locationID (outlet aktif) dikirim untuk produk beresep, agar backend
 * menghitung stok produk dari inventory outlet itu (5eb72e5). Tanpa itu
 * backend memakai outlet tenant.
 */

import type { ProdukRequest } from "@/types/produk";
import type { NilaiFormProduk } from "./schema";

export function susunPayloadProduk(
  nilai: NilaiFormProduk,
  opsi: { resepAwalAda: boolean; locationID?: string },
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
  if (adaResep && opsi.locationID) payload.locationID = opsi.locationID;
  return payload;
}