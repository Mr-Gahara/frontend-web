import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Penjualan, PenjualanRequest, StatusPenjualan } from "@/types/penjualan";

/** Perubahan penjualan lewat PUT; hanya field yang dikirim web. */
export type PerubahanPenjualan = {
  statusPenjualan?: StatusPenjualan;
  finalize?: boolean;
  locationID?: string;
};

export const penjualanApi = {
  daftar: (params: Record<string, string>) =>
    apiData.get<Penjualan[]>(EP.penjualan.list, params),
  detail: (id: string) => apiData.get<Penjualan>(EP.penjualan.detail(id)),
  buat: (payload: PenjualanRequest, kunciIdempotensi: string) =>
    apiData.post<Penjualan>(EP.penjualan.list, payload, undefined, {
      headers: { "x-idempotency-key": kunciIdempotensi },
    }),
  perbarui: (id: string, payload: PerubahanPenjualan) =>
    apiData.put<Penjualan>(EP.penjualan.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.penjualan.detail(id)),
};