import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { KategoriBeban, PayloadKategoriBeban } from "@/types/bebanOperasional";

export const kategoriBebanApi = {
  /** Diurutkan menurut nama oleh backend. */
  daftar: () => apiData.get<KategoriBeban[]>(EP.kategoriBeban.list),
  buat: (payload: PayloadKategoriBeban) =>
    apiData.post<KategoriBeban>(EP.kategoriBeban.list, payload),
  ubah: (id: string, payload: PayloadKategoriBeban) =>
    apiData.put<KategoriBeban>(EP.kategoriBeban.detail(id), payload),
  /** Ditolak 409 bila kategori masih dipakai beban, termasuk beban VOID. */
  hapus: (id: string) => apiData.delete<unknown>(EP.kategoriBeban.detail(id)),
};