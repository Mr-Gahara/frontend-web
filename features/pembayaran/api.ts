import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Pembayaran, PembatalanPembayaranRequest, PembayaranRequest } from "@/types/pembayaran";

export const pembayaranApi = {
  buat: (payload: PembayaranRequest) => apiData.post<Pembayaran>(EP.pembayaran, payload),
  batalkan: (id: string, payload: PembatalanPembayaranRequest) =>
    apiData.put<Pembayaran>(`${EP.pembayaran}/${id}`, payload),
};