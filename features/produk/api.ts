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

import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type { Produk, ProdukRequest } from "@/types/produk";

/** Satu halaman produk (P79): dengan page atau limit, server mengirim pagination. */
export type HalamanProduk = { data: Produk[]; pagination: Paginasi | null };

export const produkApi = {
  /** params disusun paramHalamanProduk (filter.ts). */
  halaman: async (params: Record<string, string>): Promise<HalamanProduk> => {
    const hasil = await api.get<Produk[]>(EP.produk.list, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  daftar: () => apiData.get<Produk[]>(EP.produk.list),
  detail: (id: string) => apiData.get<Produk>(EP.produk.detail(id)),
  buat: (payload: ProdukRequest) =>
    apiData.post<Produk>(EP.produk.list, payload),
  perbarui: (id: string, payload: ProdukRequest) =>
    apiData.put<Produk>(EP.produk.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.produk.detail(id)),
};
