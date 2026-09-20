import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { JurnalStok } from "@/types/jurnalStok";

export const jurnalStokApi = {
  daftar: () => apiData.get<JurnalStok[]>(EP.jurnalStok),
};