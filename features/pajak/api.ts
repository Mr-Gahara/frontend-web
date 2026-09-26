import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Pajak } from "@/types/pajak";

export const pajakApi = {
  daftar: () => apiData.get<Pajak[]>(EP.pajak.list),
};