import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type { Penjualan, PenjualanRequest, StatusPenjualan } from "@/types/penjualan";

/** Satu halaman daftar penjualan; backend 465b438 selalu mengirim daftar per halaman. */
export type HalamanPenjualan = { data: Penjualan[]; pagination: Paginasi | null };

/** Perubahan penjualan lewat PUT; hanya field yang dikirim web. */
export type PerubahanPenjualan = {
  statusPenjualan?: StatusPenjualan;
  finalize?: boolean;
  locationID?: string;
};

export const penjualanApi = {
  daftar: async (params: Record<string, string>): Promise<HalamanPenjualan> => {
    const hasil = await api.get<Penjualan[]>(EP.penjualan.list, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  detail: (id: string) => apiData.get<Penjualan>(EP.penjualan.detail(id)),
  buat: (payload: PenjualanRequest, kunciIdempotensi: string) =>
    apiData.post<Penjualan>(EP.penjualan.list, payload, undefined, {
      headers: { "x-idempotency-key": kunciIdempotensi },
    }),
  perbarui: (id: string, payload: PerubahanPenjualan) =>
    apiData.put<Penjualan>(EP.penjualan.detail(id), payload),
  hapus: (id: string) => apiData.delete<unknown>(EP.penjualan.detail(id)),
};