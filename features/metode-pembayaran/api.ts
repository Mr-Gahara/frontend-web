import { apiData } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type {
  MetodePembayaran,
  MetodePembayaranBaru,
  PerubahanMetodePembayaran,
} from "@/types/metodePembayaran";

export const metodePembayaranApi = {
  /** Metode aktif saja, bawaan backend untuk pilihan kasir. */
  daftar: () => apiData.get<MetodePembayaran[]>(EP.metodePembayaran.list),
  /**
   * Seluruh metode termasuk yang nonaktif, untuk halaman kelola. Sejak
   * backend 465b438, tanpa showAll=true hanya metode aktif yang dikirim
   * (keputusan PO2a).
   */
  daftarSemua: () => apiData.get<MetodePembayaran[]>(EP.metodePembayaran.list, { showAll: "true" }),
  detail: (id: string) => apiData.get<MetodePembayaran>(EP.metodePembayaran.detail(id)),
  buat: (payload: MetodePembayaranBaru) => apiData.post<MetodePembayaran>(EP.metodePembayaran.list, payload),
  perbarui: (id: string, payload: PerubahanMetodePembayaran) =>
    apiData.put<MetodePembayaran>(EP.metodePembayaran.detail(id), payload),
};
