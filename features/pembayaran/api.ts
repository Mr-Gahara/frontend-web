import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Pembayaran } from "@/types/pembayaran";

export const pembayaranApi = {
  daftar: () => apiData.get<Pembayaran[]>(EP.pembayaran),
};