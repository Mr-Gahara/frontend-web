import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Diskon } from "@/types/diskon";

export const diskonApi = {
  daftar: () => apiData.get<Diskon[]>(EP.diskon.list),
};