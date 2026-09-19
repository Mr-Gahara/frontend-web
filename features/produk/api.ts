/**
 * Pemanggilan API produk.
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts (_id menjadi id,
 * termasuk isi pajakList), dan kegagalan dilempar sebagai ApiError bertipe.
 *
 * Bentuk respons mengikuti aggregate di produkService ($lookup lalu
 * $project): kategoriID selalu berupa id mentah, dan nama kategori dikirim
 * terpisah di field kategori.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Produk } from "@/types/produk";

export const produkApi = {
  daftar: () => apiData.get<Produk[]>(EP.produk.list),
  detail: (id: string) => apiData.get<Produk>(EP.produk.detail(id)),
  hapus: (id: string) => apiData.delete<unknown>(EP.produk.detail(id)),
};
