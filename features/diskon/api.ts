import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { BuatDiskonPayload, Diskon, PerbaruiDiskonPayload } from "@/types/diskon";

export const diskonApi = {
  daftar: () => apiData.get<Diskon[]>(EP.diskon.list),
  buat: (payload: BuatDiskonPayload) => apiData.post<Diskon>(EP.diskon.list, payload),
  perbarui: (id: string, payload: PerbaruiDiskonPayload) =>
    apiData.put<Diskon>(EP.diskon.detail(id), payload),
};
