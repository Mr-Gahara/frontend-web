/**
 * Pemanggilan API kategori.
 *
 * Respons sudah ternormalisasi oleh lib/api/normalize.ts, dan kegagalan
 * dilempar sebagai ApiError. Penerjemahan pesan duplikat ada di pesan.ts.
 */

import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Kategori, KategoriRequest } from "@/types/kategori";

export const kategoriApi = {
  daftar: () => apiData.get<Kategori[]>(EP.kategori.list),
  buat: (payload: KategoriRequest) =>
    apiData.post<Kategori>(EP.kategori.list, payload),
  perbarui: (id: string, payload: KategoriRequest) =>
    apiData.put<Kategori>(EP.kategori.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.kategori.detail(id)),
};
