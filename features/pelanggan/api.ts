import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Pelanggan } from "@/types/pelanggan";

export const pelangganApi = {
  daftar: () => apiData.get<Pelanggan[]>(EP.pelanggan.list),
};