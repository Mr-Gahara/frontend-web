import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Pajak, PajakBaru, PerubahanPajak, ProdukPajakRequest, RelasiPajakProduk } from "@/types/pajak";

export const pajakApi = {
  daftar: () => apiData.get<Pajak[]>(EP.pajak.list),
  buat: (payload: PajakBaru) => apiData.post<Pajak>(EP.pajak.list, payload),
  perbarui: (id: string, payload: PerubahanPajak) => apiData.put<Pajak>(EP.pajak.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.pajak.detail(id)),
  /** Bentuknya berbeda dari GET /pajak (RelasiPajakProduk). */
  relasiProduk: (produkId: string) => apiData.get<RelasiPajakProduk[]>(EP.produkPajak.byTarget(produkId)),
  /** Upsert per produk di backend: memasang pajak lain menggantikan relasi lama. */
  pasang: (payload: ProdukPajakRequest) => apiData.post<unknown>(EP.produkPajak.list, payload),
  lepas: (relasiId: string) => apiData.delete<unknown>(EP.produkPajak.detail(relasiId)),
};