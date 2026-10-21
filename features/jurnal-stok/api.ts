import { api } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Paginasi } from "@/lib/api/normalize";
import type { JurnalStok } from "@/types/jurnalStok";

/** Satu halaman jurnal stok (B102): dengan page atau limit, server mengirim pagination. */
export type HalamanJurnalStok = { data: JurnalStok[]; pagination: Paginasi | null };

export const jurnalStokApi = {
  halaman: async (params: Record<string, string>): Promise<HalamanJurnalStok> => {
    const hasil = await api.get<JurnalStok[]>(EP.jurnalStok, params);
    return { data: hasil.data, pagination: hasil.pagination ?? null };
  },
};
