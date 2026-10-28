import { api, apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type { PengajuanStok } from "@/types/pengajuanStok";
import type { PayloadPengajuan } from "./payload";

/** Satu halaman pengajuan (B104): dengan page atau limit, server mengirim pagination. */
export type HalamanPengajuanStok = { data: PengajuanStok[]; pagination: Paginasi | null };

export const pengajuanStokApi = {
  /** params disusun paramHalamanPengajuan (filter.ts). */
  halaman: async (params: Record<string, string>): Promise<HalamanPengajuanStok> => {
    const hasil = await api.get<PengajuanStok[]>(EP.pengajuanStok.list, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
  detail: (id: string) => apiData.get<PengajuanStok>(EP.pengajuanStok.detail(id)),
  /** Semua pengajuan dari web adalah permintaan outlet ke gudang. */
  buat: (payload: PayloadPengajuan) =>
    apiData.post<PengajuanStok>(EP.pengajuanStok.list, { jenisPengajuan: "PERMINTAAN", ...payload }),
  perbarui: (id: string, payload: PayloadPengajuan) =>
    apiData.put<PengajuanStok>(EP.pengajuanStok.detail(id), payload),
  ajukan: (id: string) => apiData.patch<PengajuanStok>(EP.pengajuanStok.submit(id), {}),
  /** Respons berisi dokumen sebelum diperbarui (kontrak/temuan.md butir 26); halaman tidak memakainya. */
  setujui: (id: string) => apiData.patch<unknown>(EP.pengajuanStok.approve(id), {}),
  tolak: (id: string, alasan: string) =>
    apiData.patch<PengajuanStok>(EP.pengajuanStok.reject(id), { alasan }),
};
