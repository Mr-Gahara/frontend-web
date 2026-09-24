import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Pembayaran, PembayaranRequest } from "@/types/pembayaran";

export const pembayaranApi = {
  daftar: () => apiData.get<Pembayaran[]>(EP.pembayaran),
  buat: (payload: PembayaranRequest) => apiData.post<Pembayaran>(EP.pembayaran, payload),
};