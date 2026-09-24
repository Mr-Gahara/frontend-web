import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { MetodePembayaran } from "@/types/metodePembayaran";

export const metodePembayaranApi = {
  daftar: () => apiData.get<MetodePembayaran[]>(EP.metodePembayaran.list),
};