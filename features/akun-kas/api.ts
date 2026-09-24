import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { AkunKas } from "@/types/akunKas";

export const akunKasApi = {
  daftar: () => apiData.get<AkunKas[]>(EP.akunKas),
};